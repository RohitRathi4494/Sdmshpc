import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import XLSX from 'xlsx-js-style';
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
        // 2. Fetch Schema Data
        // a. Subjects
        // We want subjects assigned to the class OR subjects that have marks for students in this class.
        // This handles cases where data exists but the mapping might be missing or inactive.
        const subjectsQuery = `
            SELECT DISTINCT s.subject_name 
            FROM subjects s
            LEFT JOIN class_subjects cs ON s.id = cs.subject_id AND cs.class_id = $1 AND cs.academic_year_id = $2
            LEFT JOIN scholastic_scores ss ON s.id = ss.subject_id AND ss.student_id = ANY($3) AND ss.academic_year_id = $2
            WHERE cs.id IS NOT NULL OR ss.id IS NOT NULL
            ORDER BY s.subject_name
        `;

        // Need student IDs for the scores check
        const studentIds = students.map(s => s.id);

        const subjectsRes = await db.query(subjectsQuery, [classId, academicYearId, studentIds]);
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


        const scoresRes = await db.query(scoresQuery, [studentIds, academicYearId]);
        const scores = scoresRes.rows;

        // 4. Construct Excel Data & Styles

        // Define Styles
        const headerStyle = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            },
            fill: { fgColor: { rgb: "EFEFEF" } }
        };

        const cellStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
            }
        };

        // Helper to create a cell with style
        const createCell = (value: any, style: any = cellStyle) => {
            return { v: value, s: style, t: typeof value === 'number' ? 'n' : 's' };
        };

        // Build Headers with styles
        // Note: xlsx-js-style uses a slightly different structure than arrays of strings when using full style control.
        // It's safest to build the worksheet cell by cell or use aoa_to_sheet and then apply styles.
        // Let's stick with aoa_to_sheet logic but construct the objects directly.

        const headerRow0: any[] = [createCell('Admission No', headerStyle), createCell('Roll No', headerStyle), createCell('Student Name', headerStyle)];
        const headerRow1: any[] = [createCell('', headerStyle), createCell('', headerStyle), createCell('', headerStyle)];
        const headerRow2: any[] = [createCell('', headerStyle), createCell('', headerStyle), createCell('', headerStyle)];

        const merges: any[] = [
            { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }, // Adm No
            { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } }, // Roll No
            { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } }, // Name
        ];

        let colIndex = 3;

        subjects.forEach(subj => {
            const subjectStartCol = colIndex;

            terms.forEach(term => {
                const termStartCol = colIndex;

                COMPONENT_ORDER.forEach(comp => {
                    const label = COMPONENT_MAP[comp] || comp;
                    headerRow2.push(createCell(label, headerStyle));
                    colIndex++;
                });

                // Add Term Header at start of its block
                headerRow1[termStartCol] = createCell(term, headerStyle);
                // Fill empty cells for merge to carry style
                for (let i = termStartCol + 1; i < colIndex; i++) {
                    headerRow1[i] = createCell('', headerStyle);
                }
                merges.push({ s: { r: 1, c: termStartCol }, e: { r: 1, c: colIndex - 1 } });
            });

            // Add Subject Header
            headerRow0[subjectStartCol] = createCell(subj, headerStyle);
            // Fill empty cells for merge
            for (let i = subjectStartCol + 1; i < colIndex; i++) {
                headerRow0[i] = createCell('', headerStyle);
            }
            merges.push({ s: { r: 0, c: subjectStartCol }, e: { r: 0, c: colIndex - 1 } });
        });

        // Fill remaining empty cells in header rows to complete the rectangle for proper borders
        for (let i = 3; i < colIndex; i++) {
            if (!headerRow0[i]) headerRow0[i] = createCell('', headerStyle);
            if (!headerRow1[i]) headerRow1[i] = createCell('', headerStyle);
        }

        const dataRows: any[] = [];
        students.forEach(student => {
            const row: any[] = [
                createCell(student.admission_no),
                createCell(student.roll_no),
                createCell(student.student_name, { ...cellStyle, alignment: { horizontal: "left", vertical: "center" } }) // Align name left
            ];

            subjects.forEach(subj => {
                terms.forEach(term => {
                    COMPONENT_ORDER.forEach(comp => {
                        const scoreEntry = scores.find(s =>
                            s.student_id === student.id &&
                            s.subject_name === subj &&
                            s.term_name === term &&
                            s.component_name === comp
                        );
                        row.push(createCell(scoreEntry ? scoreEntry.marks : ''));
                    });
                });
            });
            dataRows.push(row);
        });

        // 6. Generate Sheet
        // aoa_to_sheet can accept cell objects if they have {v, t, s}
        const wsData = [headerRow0, headerRow1, headerRow2, ...dataRows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        worksheet['!merges'] = merges;

        // Column Widths
        const wscols = [
            { wch: 12 }, // Adm
            { wch: 8 },  // Roll
            { wch: 30 }, // Name
        ];
        // Add minimal width for data columns
        for (let i = 3; i < colIndex; i++) {
            wscols.push({ wch: 6 });
        }
        worksheet['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, worksheet, "Scholastic");

        // Write with styles
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
