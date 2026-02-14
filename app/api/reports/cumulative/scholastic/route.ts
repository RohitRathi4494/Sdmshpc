import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import * as XLSX from 'xlsx';
import { extractToken, verifyAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = extractToken(req.headers.get('Authorization'));
        const auth = await verifyAuth(token);
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
            SELECT s.id, s.admission_no, s.student_name, se.roll_no
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            WHERE se.class_id = $1 AND se.academic_year_id = $2
        `;
        const queryParams: any[] = [classId, academicYearId];

        if (sectionId) {
            studentQuery += ` AND se.section_id = $3`;
            queryParams.push(sectionId);
        }

        studentQuery += ` ORDER BY se.roll_no, s.student_name`;

        const studentsRes = await db.query(studentQuery, queryParams);
        const students = studentsRes.rows;

        if (students.length === 0) {
            return NextResponse.json({ error: 'No students found for this section' }, { status: 404 });
        }

        // 2. Fetch Schema Data (Subjects, Terms, Components) to build fixed columns
        // a. Subjects for this class
        const subjectsQuery = `
            SELECT sub.subject_name 
            FROM class_subjects cs
            JOIN subjects sub ON cs.subject_id = sub.id
            WHERE cs.class_id = $1 AND cs.academic_year_id = $2
            ORDER BY sub.subject_name
        `;
        const subjectsRes = await db.query(subjectsQuery, [classId, academicYearId]);
        const subjects = subjectsRes.rows.map(r => r.subject_name);

        // b. Terms
        const termsRes = await db.query(`SELECT term_name FROM terms ORDER BY term_name`, []);
        const terms = termsRes.rows.map(r => r.term_name);

        // c. Components
        const componentsRes = await db.query(`SELECT component_name FROM assessment_components ORDER BY id`, []);
        const components = componentsRes.rows.map(r => r.component_name);

        // 3. Fetch All Scores for these students
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

        // 4. Generate Rigid Columns (Subject x Term x Component)
        const sortedKeys: string[] = [];
        subjects.forEach(subj => {
            terms.forEach(term => {
                components.forEach(comp => {
                    sortedKeys.push(`${subj}|${term}|${comp}`);
                });
            });
        });

        // 5. Build Rows
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

    } catch (error: any) {
        console.error('Error generating scholastic report:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
