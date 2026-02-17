import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

// Helper to normalize DD-MMM-YY to YYYY-MM-DD
function normalizeDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // If already YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // Handle DD-MMM-YY (e.g., 08-May-14)
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1];
        const yearShort = parts[2];

        const months: { [key: string]: string } = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
            'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };

        const month = months[monthStr];
        // Assume 20xx for 2-digit years
        const year = yearShort.length === 2 ? '20' + yearShort : yearShort;

        if (day && month && year) {
            return `${year}-${month}-${day}`;
        }
    }
    return null;
}

const studentImportSchema = z.object({
    action: z.enum(['preview', 'confirm']),
    data: z.array(z.object({
        admission_no: z.string().min(1),
        student_name: z.string().min(1),
        father_name: z.string().min(1),
        mother_name: z.string().min(1),
        dob: z.string().min(1),
        class_name: z.string().min(1),
        section_name: z.string().min(1),
    })),
});

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // 1. Pre-process data to normalize dates
        if (body.data && Array.isArray(body.data)) {
            body.data = body.data.map((row: any) => ({
                ...row,
                dob: normalizeDate(row.dob) || row.dob // Try to normalize, else keep original for validation failure
            }));
        }

        const result = studentImportSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { action, data } = result.data;

        // Fetch Masters for Validation
        const activeYearRes = await db.query('SELECT id FROM academic_years WHERE is_active = true LIMIT 1');
        const activeYearId = activeYearRes.rows[0]?.id;

        if (!activeYearId) {
            return NextResponse.json({ success: false, message: 'No active academic year found' }, { status: 400 });
        }

        const classesRes = await db.query('SELECT id, class_name FROM classes');
        const sectionsRes = await db.query('SELECT id, section_name, class_id FROM sections');

        // Create Lookups (Case insensitive)
        const classMap = new Map<string, number>(); // lowercase name -> id
        classesRes.rows.forEach(c => classMap.set(c.class_name.toLowerCase(), c.id));

        // Map: classId_sectionNameLower -> sectionId
        const sectionMap = new Map<string, number>();
        sectionsRes.rows.forEach(s => sectionMap.set(`${s.class_id}_${s.section_name.toLowerCase()}`, s.id));

        const errors: any[] = [];
        const validData: any[] = [];

        // 2. Validation Logic 
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let rowError: string | null = null;

            // 1. Validate Date
            if (!/^\d{4}-\d{2}-\d{2}$/.test(row.dob)) {
                rowError = 'Invalid Date Format';
            }

            // 2. Validate Class & Section
            const classId = classMap.get(row.class_name.toLowerCase());
            if (!classId) {
                rowError = rowError || `Class '${row.class_name}' not found`;
            }

            let sectionId = null;
            if (classId) {
                sectionId = sectionMap.get(`${classId}_${row.section_name.toLowerCase()}`);
                if (!sectionId) {
                    rowError = rowError || `Section '${row.section_name}' not found in Class '${row.class_name}'`;
                }
            }

            // 3. Duplicate Check
            const dupCheck = await db.query('SELECT id FROM students WHERE admission_no = $1', [row.admission_no]);
            if (dupCheck.rows.length > 0) {
                rowError = 'Admission number already exists';
            }

            if (rowError) {
                errors.push({ index: i, admission_no: row.admission_no, error: rowError });
            } else {
                // Attach resolved IDs to the object for confirmed insert
                validData.push({ ...row, class_id: classId, section_id: sectionId });
            }
        }

        if (action === 'preview') {
            return NextResponse.json({
                success: true,
                summary: {
                    total: data.length,
                    valid: validData.length,
                    invalid: errors.length,
                },
                errors,
                data: validData, // Return valid data for confirmation payload
            });
        }

        // CONFIRM ACTION
        if (action === 'confirm') {
            if (validData.length === 0) {
                return NextResponse.json({
                    success: false,
                    error_code: 'NO_DATA',
                    message: 'No valid data to import. See errors for details.',
                    summary: {
                        total: data.length,
                        imported: 0,
                        failed: errors.length
                    },
                    errors
                }, { status: 400 });
            }

            // Bulk Insert
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');

                for (const row of validData) {
                    // 1. Insert Student
                    const studentRes = await client.query(
                        'INSERT INTO students (admission_no, student_name, father_name, mother_name, dob) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                        [row.admission_no, row.student_name, row.father_name, row.mother_name, row.dob]
                    );
                    const studentId = studentRes.rows[0].id;

                    // 2. Enroll Student
                    await client.query(
                        'INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)',
                        [studentId, row.class_id, row.section_id, activeYearId]
                    );
                }

                await client.query('COMMIT');

                return NextResponse.json({
                    success: true,
                    message: `Imported: ${validData.length}, Failed/Skipped: ${errors.length}`,
                    summary: {
                        total: data.length,
                        imported: validData.length,
                        failed: errors.length
                    },
                    errors: errors // Return errors so UI can show them
                });

            } catch (e) {
                await client.query('ROLLBACK');
                throw e;
            } finally {
                client.release();
            }
        }

    } catch (error: any) {
        console.error('Import Error:', error);
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
