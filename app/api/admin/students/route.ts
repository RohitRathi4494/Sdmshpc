import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id');
        const status = searchParams.get('status'); // 'enrolled' | 'unenrolled' | 'all'
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id');

        let query = '';
        const values: any[] = [];

        if (status === 'unenrolled' && academic_year_id) {
            // Find students NOT in student_enrollments for this year
            query = `
                SELECT s.* 
                FROM students s
                WHERE NOT EXISTS (
                    SELECT 1 FROM student_enrollments se 
                    WHERE se.student_id = s.id AND se.academic_year_id = $1
                )
                ORDER BY s.student_name ASC
            `;
            values.push(parseInt(academic_year_id));
        } else if (class_id && academic_year_id) {
            // Find students in specific class/year
            let sectionClause = '';
            if (section_id) {
                sectionClause = `AND se.section_id = $3`;
            }

            query = `
                SELECT s.*, se.roll_no, se.section_id, c.class_name
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id
                JOIN classes c ON se.class_id = c.id
                WHERE se.class_id = $1 AND se.academic_year_id = $2 ${sectionClause}
                ORDER BY se.roll_no ASC, s.student_name ASC
            `;
            values.push(parseInt(class_id), parseInt(academic_year_id));
            if (section_id) values.push(parseInt(section_id));

        } else if (academic_year_id) {
            // [NEW] Find ALL students enrolled in the academic year (regardless of class)
            // Useful for Fee Collection search
            query = `
                SELECT s.*, se.roll_no, se.section_id, c.class_name
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id
                JOIN classes c ON se.class_id = c.id
                WHERE se.academic_year_id = $1
                ORDER BY c.display_order ASC, s.student_name ASC
            `;
            values.push(parseInt(academic_year_id));

        } else {
            // Default: List all students (maybe limit?)
            query = 'SELECT * FROM students ORDER BY id DESC LIMIT 100';
        }

        const { rows } = await db.query(query, values);

        return NextResponse.json({
            success: true,
            data: rows,
        });

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

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
        const {
            admission_no, student_name, father_name, mother_name, dob,
            class_id, section_id, academic_year_id,
            // New Fields
            admission_date, gender, blood_group, category,
            address, phone_no, emergency_no,
            aadhar_no, ppp_id, apaar_id, srn_no,
            board_roll_x, board_roll_xii, education_reg_no,
            // Senior Secondary Fields
            stream, subject_count
        } = body;

        if (!admission_no || !student_name || !father_name || !dob) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Auto-generate Student Code if new (simple logic: SC + Year + Random/Sequence)
            // For now, using Random 4 digits + Year.
            const currentYear = new Date().getFullYear();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
            // Ideally should check uniqueness, but for now simple generation. 
            // Better: SC + AdmissionNo if distinct? Or just random.
            // User requested "auto generated by the system".
            const student_code = `SC${currentYear}${randomSuffix}`;

            // 1. Insert Student
            // Note: Removed ON CONFLICT UPDATE for now to ensure we don't accidentally overwrite if admission_no matches but it's a different person intended.
            // But usually admission_no IS unique. If it exists, should we error or update?
            // Existing logic was Upsert. I will keep it as Insert and let it fail on duplicate admission_no, 
            // OR if user wants upsert, we need to be careful with student_code (don't overwrite existing).
            // Let's stick to INSERT and return error if exists, safest for "Add New".

            // Check if admission_no exists
            const existingCheck = await client.query('SELECT id FROM students WHERE admission_no = $1', [admission_no]);
            if (existingCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error_code: 'DUPLICATE_ADMISSION_NO', message: 'Admission number already exists' },
                    { status: 400 }
                );
            }

            const insertStudentQuery = `
                INSERT INTO students (
                    admission_no, student_code, student_name, father_name, mother_name, dob, admission_date,
                    gender, blood_group, category, address, phone_no, emergency_no,
                    aadhar_no, ppp_id, apaar_id, srn_no, board_roll_x, board_roll_xii, education_reg_no,
                    stream, subject_count
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                RETURNING id;
            `;

            const studentRes = await client.query(insertStudentQuery, [
                admission_no, student_code, student_name, father_name, mother_name || '', dob,
                admission_date ? new Date(admission_date) : new Date(),
                gender || 'Male', blood_group || '', category || 'General',
                address || '', phone_no || '', emergency_no || '',
                aadhar_no || '', ppp_id || '', apaar_id || '', srn_no || '',
                board_roll_x || '', board_roll_xii || '', education_reg_no || '',
                stream || null, subject_count || 5
            ]);

            const studentId = studentRes.rows[0].id;

            // 2. Enroll if class/section provided
            if (class_id && section_id && academic_year_id) {
                await client.query(`
                    INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id)
                    VALUES ($1, $2, $3, $4)
                `, [studentId, class_id, section_id, academic_year_id]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Student created successfully',
                data: { id: studentId, student_code }
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Create student error:', error);
        return NextResponse.json(
            { success: false, error_code: 'SERVER_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
