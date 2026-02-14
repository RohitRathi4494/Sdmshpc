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
        const sectionId = searchParams.get('section_id');
        const academicYearId = searchParams.get('academic_year_id') || 1;

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
        const studentIds = students.map(s => s.id);

        if (students.length === 0) {
            return NextResponse.json({ error: 'No students found' }, { status: 404 });
        }

        // 2. Fetch Co-Scholastic Scores (including Personality which shares the table or structure)
        // We need SubSkill Name, Term, and Grade
        const scoresQuery = `
            SELECT 
                css.student_id,
                sub.sub_skill_name,
                dom.domain_name,
                t.term_name,
                css.grade
            FROM co_scholastic_scores css
            JOIN sub_skills sub ON css.sub_skill_id = sub.id
            JOIN domains dom ON sub.domain_id = dom.id
            JOIN terms t ON css.term_id = t.id
            WHERE css.student_id = ANY($1)
            AND css.academic_year_id = $2
            ORDER BY dom.id, sub.id
        `;

        const scoresRes = await db.query(scoresQuery, [studentIds, academicYearId]);
        const scores = scoresRes.rows;

        // 3. Pivot Data
        // Structure: Student Info | Domain - SubSkill - Term 1 | Domain - SubSkill - Term 2 ...

        const uniqueColumns = new Set<string>();
        // To maintain order, we might want to track them as we see them or query distinct separately.
        // But pivoting in memory is fine.

        scores.forEach(r => {
            const key = `${r.domain_name} - ${r.sub_skill_name} - ${r.term_name}`;
            uniqueColumns.add(key);
        });

        const sortedKeys = Array.from(uniqueColumns).sort((a, b) => {
            // Sort by Domain, then SubSkill, then Term?
            // Since string sort might not be perfect (e.g. Term II before Term I), we can refine if needed.
            // For now, alphabetical is decent enough for "Art - .." vs "Personality - .."
            return a.localeCompare(b);
        });

        // 4. Build Rows
        const data = students.map(student => {
            const row: any = {
                'Admission No': student.admission_no,
                'Roll No': student.roll_no,
                'Student Name': student.student_name
            };

            sortedKeys.forEach(key => {
                // key is "Domain - SubSkill - Term"
                const [domain, subskill, term] = key.split(' - '); // Carefully split

                const scoreEntry = scores.find(s =>
                    s.student_id === student.id &&
                    s.sub_skill_name === subskill &&
                    s.term_name === term &&
                    s.domain_name === domain
                );

                row[key] = scoreEntry ? scoreEntry.grade : '';
            });

            return row;
        });

        // 5. Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Co-Scholastic");

        const wscols = [
            { wch: 15 },
            { wch: 10 },
            { wch: 30 },
        ];
        sortedKeys.forEach(() => wscols.push({ wch: 20 }));
        worksheet['!cols'] = wscols;

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="co_scholastic_report_${classId}_${sectionId || 'all'}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error) {
        console.error('Error generating co-scholastic report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
