import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import * as XLSX from 'xlsx';
import { verifyAuth } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('class_id');
        const sectionId = searchParams.get('section_id'); // Optional, but usually needed for a sheet
        const academicYearId = searchParams.get('academic_year_id') || 1; // Default to 1 if not provided

        if (!classId) {
            return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
        }

        // 1. Fetch Students
        let studentQuery = `
            SELECT s.id, s.admission_no, s.student_name, s.roll_no
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            WHERE se.class_id = $1 AND se.academic_year_id = $2
        `;
        const queryParams: any[] = [classId, academicYearId];

        if (sectionId) {
            studentQuery += ` AND se.section_id = $3`;
            queryParams.push(sectionId);
        }

        studentQuery += ` ORDER BY s.roll_no, s.student_name`;

        const studentsRes = await db.query(studentQuery, queryParams);
        const students = studentsRes.rows;

        // 2. Fetch All Scores for these students
        // We need Subject, Term, Component, and Marks
        // We also need to know the max marks for context, but maybe just marks is enough for the sheet.
        const scoresQuery = `
            SELECT 
                ss.student_id,
                sub.subject_name,
                t.term_name,
                ac.component_name,
                ss.marks
            FROM scholastic_scores ss
            JOIN subjects sub ON ss.subject_id = sub.id
            JOIN terms t ON ss.term_id = t.id
            JOIN assessment_components ac ON ss.component_id = ac.id
            WHERE ss.student_id = ANY($1)
            AND ss.academic_year_id = $2
        `;

        const studentIds = students.map(s => s.id);
        const scoresRes = await db.query(scoresQuery, [studentIds, academicYearId]);
        const scores = scoresRes.rows;

        // 3. Pivot Data
        // Structure: Student Info | Subject 1 - Term 1 - Comp 1 | Subject 1 - Term 1 - Comp 2 ...

        // First, build a distinct list of columns based on the data found (or ideally all possible combinations)
        // For a rigid report, we might want a fixed set, but dynamic based on data is safer for now.
        // Let's gather all unique (Subject, Term, Component) tuples and sort them logically.

        const uniqueColumns = new Set<string>();
        const columnMap = new Map<string, any>(); // Key -> { subject, term, component }

        scores.forEach(r => {
            const key = `${r.subject_name}|${r.term_name}|${r.component_name}`;
            uniqueColumns.add(key);
            if (!columnMap.has(key)) {
                columnMap.set(key, {
                    subject: r.subject_name,
                    term: r.term_name,
                    component: r.component_name
                });
            }
        });

        // Sort columns: Subject -> Term -> Component (You might want a specific order for Terms/Components)
        // Terms: Term I, Term II. Components: Periodic Assessment, Notebook, etc.
        const sortedKeys = Array.from(uniqueColumns).sort((a, b) => {
            const [s1, t1, c1] = a.split('|');
            const [s2, t2, c2] = b.split('|');

            if (s1 !== s2) return s1.localeCompare(s2);
            if (t1 !== t2) return t1.localeCompare(t2); // Term I before Term II (alphabetical works for I vs II but lucky)
            return c1.localeCompare(c2);
        });

        // 4. Build Rows
        const data = students.map(student => {
            const row: any = {
                'Admission No': student.admission_no,
                'Roll No': student.roll_no,
                'Student Name': student.student_name
            };

            sortedKeys.forEach(key => {
                const [subj, term, comp] = key.split('|');
                const scoreEntry = scores.find(s =>
                    s.student_id === student.id &&
                    s.subject_name === subj &&
                    s.term_name === term &&
                    s.component_name === comp
                );

                // Column Header format: "Math - Term I - Periodic"
                const colName = `${subj} - ${term} - ${comp}`;
                row[colName] = scoreEntry ? scoreEntry.marks : '';
            });

            return row;
        });

        // 5. Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Scholastic");

        // Adjust column widths slightly
        const wscols = [
            { wch: 15 }, // Admission No
            { wch: 10 }, // Roll No
            { wch: 30 }, // Name
        ];
        // Add default width for dynamic columns
        sortedKeys.forEach(() => wscols.push({ wch: 15 }));
        worksheet['!cols'] = wscols;

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="scholastic_report_${classId}_${sectionId || 'all'}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error) {
        console.error('Error generating scholastic report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
