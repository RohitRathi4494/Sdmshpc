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
        const sectionId = searchParams.get('section_id'); // Optional
        const termNameParam = searchParams.get('term'); // Optional: 'Term I' or 'Term II'
        const academicYearId = searchParams.get('academic_year_id') || 1;

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

        // 2. Fetch Schema Data
        // a. Subjects
        const subjectsQuery = `
            SELECT sub.subject_name 
            FROM class_subjects cs
            JOIN subjects sub ON cs.subject_id = sub.id
            WHERE cs.class_id = $1 AND cs.academic_year_id = $2
            ORDER BY sub.subject_name
        `;
        const subjectsRes = await db.query(subjectsQuery, [classId, academicYearId]);
        const subjects = subjectsRes.rows.map(r => r.subject_name);

        // b. Terms (Filter if param provided)
        let termsQuery = `SELECT term_name FROM terms ORDER BY term_name`;
        let termsRes = await db.query(termsQuery, []);
        let terms = termsRes.rows.map(r => r.term_name);

        if (termNameParam) {
            terms = terms.filter(t => t === termNameParam);
        }

        // c. Components
        // We know the specific order and aliases required
        const COMPONENT_MAP: any = {
            'Periodic Assessment': 'PA',
            'Subject Enrichment Activities': 'SEA',
            'Internal Assessment': 'IA',
            'Terminal Assessment': 'TA'
        };
        const COMPONENT_ORDER = ['Periodic Assessment', 'Subject Enrichment Activities', 'Internal Assessment', 'Terminal Assessment'];

        // 3. Fetch Scores
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

        // 4. Construct Excel Data (Array of Arrays)
        // Headers:
        // Row 0: Admission No | Roll No | Student Name | Subject 1 ............ | Subject 2 ............ |
        // Row 1:              |         |              | Term 1 .... | Term 2 .... | Term 1 .... | Term 2 .... |
        // Row 2:              |         |              | PA | SEA | VM | TA | PA ... | PA | SEA | VM | TA | PA ... |

        const headerRow0 = ['Admission No', 'Roll No', 'Student Name'];
        const headerRow1 = ['', '', ''];
        const headerRow2 = ['', '', ''];

        const merges: any[] = [
            { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }, // Adm No
            { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } }, // Roll No
            { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } }, // Name
        ];

        let colIndex = 3;

        subjects.forEach(subj => {
            // Subject Merge
            const subjectStartCol = colIndex;

            terms.forEach(term => {
                // Term Merge
                const termStartCol = colIndex;

                COMPONENT_ORDER.forEach(comp => {
                    headerRow2.push(COMPONENT_MAP[comp] || comp);
                    colIndex++;
                });

                // Add Term Header at start of its block
                headerRow1[termStartCol] = term;
                // Merge Term (4 columns per term)
                merges.push({ s: { r: 1, c: termStartCol }, e: { r: 1, c: colIndex - 1 } });
            });

            // Add Subject Header at start of its block
            headerRow0[subjectStartCol] = subj;
            // Merge Subject (Terms * Components columns)
            merges.push({ s: { r: 0, c: subjectStartCol }, e: { r: 0, c: colIndex - 1 } });
        });

        const aoaData = [headerRow0, headerRow1, headerRow2];

        // 5. Add Student Data Rows
        students.forEach(student => {
            const row = [student.admission_no, student.roll_no, student.student_name];

            subjects.forEach(subj => {
                terms.forEach(term => {
                    COMPONENT_ORDER.forEach(comp => {
                        const scoreEntry = scores.find(s =>
                            s.student_id === student.id &&
                            s.subject_name === subj &&
                            s.term_name === term &&
                            s.component_name === comp
                        );
                        row.push(scoreEntry ? scoreEntry.marks : '');
                    });
                });
            });
            aoaData.push(row);
        });

        // 6. Generate Sheet
        const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
        worksheet['!merges'] = merges;

        // Column Widths
        const wscols = [
            { wch: 12 }, // Adm
            { wch: 8 },  // Roll
            { wch: 25 }, // Name
        ];
        // Add minimal width for data columns
        for (let i = 3; i < colIndex; i++) {
            wscols.push({ wch: 6 });
        }
        worksheet['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, worksheet, "Scholastic");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="scholastic_report_${classId}_${sectionId || 'all'}_${termNameParam || 'cumulative'}.xlsx"`,
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
