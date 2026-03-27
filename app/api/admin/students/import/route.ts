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
        mother_name: z.string().optional(),
        dob: z.string().min(1),
        class_name: z.string().min(1),
        section_name: z.string().min(1),
        // New Fields (Optional or Required based on business logic, making most optional for import flexibility)
        admission_date: z.string().optional(),
        gender: z.string().optional(),
        blood_group: z.string().optional(),
        address: z.string().optional(),
        phone_no: z.string().optional(),
        emergency_no: z.string().optional(),
        category: z.string().optional(),
        aadhar_no: z.string().optional(),
        ppp_id: z.string().optional(),
        apaar_id: z.string().optional(),
        srn_no: z.string().optional(),
        board_roll_x: z.string().optional(),
        board_roll_xii: z.string().optional(),
        education_reg_no: z.string().optional(),
        student_code: z.string().optional(),
        stream: z.string().optional(),
        subject_count: z.number().optional(),
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
                dob: normalizeDate(row.dob) || row.dob,
                admission_date: normalizeDate(row.admission_date) || row.admission_date
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

        const classesRes = await db.query('SELECT id, class_name FROM classes WHERE tenant_id = $1', [user.tenant_id]);
        const sectionsRes = await db.query('SELECT id, section_name, class_id FROM sections WHERE tenant_id = $1', [user.tenant_id]);

        // Create Lookups (Case insensitive)
        const classMap = new Map<string, number>(); // lowercase name -> id
        classesRes.rows.forEach(c => classMap.set(c.class_name.toLowerCase(), c.id));

        // Map: classId_sectionNameLower -> sectionId
        const sectionMap = new Map<string, number>();
        sectionsRes.rows.forEach(s => sectionMap.set(`${s.class_id}_${s.section_name.toLowerCase()}`, s.id));

        const errors: any[] = [];
        const validData: any[] = [];
        const seenAdmissionNos = new Set<string>(); // To check for duplicates within the uploaded file

        // 2. Validation Logic 
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +1 for 0-index, +1 for header row
            let rowErrors: string[] = [];

            // 1. Mandatory Fields
            if (!row.admission_no || row.admission_no.toString().trim() === '') rowErrors.push("Missing admission number");
            if (!row.student_name || row.student_name.toString().trim() === '') rowErrors.push("Missing student name");
            if (!row.class_name || row.class_name.toString().trim() === '') rowErrors.push("Missing class");
            if (!row.section_name || row.section_name.toString().trim() === '') rowErrors.push("Missing section");
            if (!row.dob || row.dob.toString().trim() === '') rowErrors.push("Missing DOB");

            // 2. Validate Date Format (Allows YYYY-MM-DD or DD/MM/YYYY)
            const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
            const dmyRegex = /^\d{2}\/\d{2}\/\d{4}$/;

            if (row.dob && !isoRegex.test(row.dob) && !dmyRegex.test(row.dob)) {
                rowErrors.push('Invalid DOB Format (Must be YYYY-MM-DD or DD/MM/YYYY)');
            }
            if (row.admission_date && !isoRegex.test(row.admission_date) && !dmyRegex.test(row.admission_date)) {
                rowErrors.push('Invalid Admission Date Format (Must be YYYY-MM-DD or DD/MM/YYYY)');
            }

            // Normalize DD/MM/YYYY to YYYY-MM-DD for database compatibility
            if (row.dob && dmyRegex.test(row.dob)) {
                const parts = row.dob.split('/');
                row.dob = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            if (row.admission_date && dmyRegex.test(row.admission_date)) {
                const parts = row.admission_date.split('/');
                row.admission_date = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            // 3. Validate Class & Section
            const classId = classMap.get(row.class_name?.toString().toLowerCase());
            if (!classId) {
                rowErrors.push(`Invalid class: '${row.class_name}'`);
            }

            let sectionId = null;
            if (classId) {
                sectionId = sectionMap.get(`${classId}_${row.section_name?.toString().toLowerCase()}`);
                if (!sectionId) {
                    rowErrors.push(`Invalid section: '${row.section_name}' for class '${row.class_name}'`);
                }
            }

            // 4. Duplicate Check - Internal File Check
            if (row.admission_no && seenAdmissionNos.has(row.admission_no.toString().trim())) {
                rowErrors.push(`Duplicate admission number in uploaded file: ${row.admission_no}`);
            } else if (row.admission_no) {
                seenAdmissionNos.add(row.admission_no.toString().trim());
            }

            // 5. Duplicate Check - Database Check
            if (row.admission_no && rowErrors.length === 0 || (!rowErrors.find(e => e.includes('Duplicate admission number')))) {
                const dupCheck = await db.query('SELECT id FROM students WHERE admission_no = $1 AND tenant_id = $2', [row.admission_no.toString().trim(), user.tenant_id]);
                if (dupCheck.rows.length > 0) {
                    rowErrors.push(`Admission number already exists in system: ${row.admission_no}`);
                }
            }

            if (rowErrors.length > 0) {
                // If there are multiple errors for a row, we push them individually or join them
                // The requirements asked for { row: 4, error: "Duplicate admission number" }
                // So we will join multiple errors for the same row to keep the UI clean
                errors.push({ row: rowNumber, admission_no: row.admission_no, error: rowErrors.join(', ') });
            } else {
                // Attach resolved IDs to the object for confirmed insert
                validData.push({ ...row, class_id: classId, section_id: sectionId });
            }
        }

        if (action === 'preview') {
            return NextResponse.json({
                success: true,
                data: {
                    summary: {
                        total: data.length,
                        valid: validData.length,
                        invalid: errors.length,
                    },
                    errors,
                    validData: validData,
                }
            });
        }

        // CONFIRM ACTION
        if (action === 'confirm') {
            if (validData.length === 0) {
                return NextResponse.json({
                    success: false,
                    error_code: 'NO_DATA',
                    message: 'No valid data to import. See errors for details.',
                    data: {
                        summary: {
                            total: data.length,
                            imported: 0,
                            failed: errors.length
                        },
                        errors
                    }
                }, { status: 400 });
            }

            // Bulk Insert
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');

                for (const row of validData) {
                    // 1. Insert Student
                    // Handle optional types
                    const admissionDate = row.admission_date ? new Date(row.admission_date) : new Date();

                    const studentRes = await client.query(`
                        INSERT INTO students 
                        (admission_no, student_name, father_name, mother_name, dob, admission_date, 
                         blood_group, gender, address, phone_no, emergency_no, category, 
                         aadhar_no, ppp_id, apaar_id, srn_no, board_roll_x, board_roll_xii, education_reg_no, student_code, stream, subject_count, tenant_id) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
                        RETURNING id`,
                        [
                            row.admission_no, row.student_name, row.father_name, row.mother_name || '', row.dob, admissionDate,
                            row.blood_group || '', row.gender || 'Male', row.address || '', row.phone_no || '', row.emergency_no || '', row.category || 'General',
                            row.aadhar_no || '', row.ppp_id || '', row.apaar_id || '', row.srn_no || '', row.board_roll_x || '', row.board_roll_xii || '', row.education_reg_no || '',
                            row.student_code || '',
                            row.stream || null,
                            row.subject_count || 5,
                            user.tenant_id
                        ]
                    );
                    const studentId = studentRes.rows[0].id;

                    // 2. Enroll Student
                    // Note: roll_no is intentionally omitted here to allow for auto-assignment later section-wise
                    await client.query(
                        'INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, tenant_id) VALUES ($1, $2, $3, $4, $5)',
                        [studentId, row.class_id, row.section_id, activeYearId, user.tenant_id]
                    );
                }

                await client.query('COMMIT');

                return NextResponse.json({
                    success: true,
                    message: `Imported: ${validData.length}, Failed/Skipped: ${errors.length}`,
                    data: {
                        summary: {
                            total: data.length,
                            imported: validData.length,
                            failed: errors.length
                        },
                        errors: errors,
                        message: `Imported: ${validData.length}, Failed/Skipped: ${errors.length}`
                    }
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
