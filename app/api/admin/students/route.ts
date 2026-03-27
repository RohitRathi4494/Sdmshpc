import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE && user.role !== UserRole.SUPER_ADMIN)) {
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
        const visibility_status = searchParams.get('visibility_status'); // 'ACTIVE', 'WITHDRAWN', or null (all)
        const target_tenant_id = searchParams.get('tenant_id');

        // Tenant Isolation Logic
        let effective_tenant_id: number | null = user.tenant_id;
        let is_global_search = false;

        if (user.role === UserRole.SUPER_ADMIN) {
            if (target_tenant_id) {
                effective_tenant_id = parseInt(target_tenant_id);
                is_global_search = false;
            } else {
                is_global_search = true;
            }
        }

        const tenantClause = is_global_search ? '1=1' : `s.tenant_id = $1`;
        let query = '';
        let values: any[] = is_global_search ? [] : [effective_tenant_id];

        if (status === 'unenrolled' && academic_year_id) {
            // Find students NOT in student_enrollments for this year
            query = `
                SELECT s.* 
                FROM students s
                WHERE ${tenantClause} AND NOT EXISTS (
                    SELECT 1 FROM student_enrollments se 
                    WHERE se.student_id = s.id AND se.academic_year_id = $${values.length + 1} AND se.tenant_id = s.tenant_id
                )
                ORDER BY s.student_name ASC
            `;
            values.push(parseInt(academic_year_id));
        } else if (class_id && academic_year_id) {
            // Find students in specific class/year
            let sectionClause = '';
            if (section_id) {
                sectionClause = `AND se.section_id = $${values.length + 3}`;
            }

            query = `
                SELECT s.*, se.roll_no, se.section_id, c.class_name, t.school_code
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id AND se.tenant_id = s.tenant_id
                JOIN classes c ON se.class_id = c.id AND c.tenant_id = s.tenant_id
                JOIN tenants t ON s.tenant_id = t.id
                WHERE ${tenantClause} AND se.class_id = $${values.length + 1} AND se.academic_year_id = $${values.length + 2} ${sectionClause} ${visibility_status ? `AND s.status = $${values.length + (section_id ? 4 : 3)}` : ''}
                ORDER BY se.roll_no ASC, s.student_name ASC
            `;
            values.push(parseInt(class_id), parseInt(academic_year_id));
            if (section_id) values.push(parseInt(section_id));
            if (visibility_status) values.push(visibility_status);

        } else if (academic_year_id) {
            // Find ALL students enrolled in the academic year
            query = `
                SELECT s.*, se.roll_no, se.section_id, c.class_name, t.school_code
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id AND se.tenant_id = s.tenant_id
                JOIN classes c ON se.class_id = c.id AND c.tenant_id = s.tenant_id
                JOIN tenants t ON s.tenant_id = t.id
                WHERE ${tenantClause} AND se.academic_year_id = $${values.length + 1} ${visibility_status ? `AND s.status = $${values.length + 2}` : ''}
                ORDER BY c.display_order ASC, s.student_name ASC
            `;
            values.push(parseInt(academic_year_id));
            if (visibility_status) values.push(visibility_status);

        } else {
            // Default: List all students
            if (visibility_status) {
                query = `SELECT s.*, t.school_code FROM students s JOIN tenants t ON s.tenant_id = t.id WHERE ${tenantClause} AND s.status = $${values.length + 1} ORDER BY s.id DESC LIMIT 100`;
                values.push(visibility_status);
            } else {
                query = `SELECT s.*, t.school_code FROM students s JOIN tenants t ON s.tenant_id = t.id WHERE ${tenantClause} ORDER BY s.id DESC LIMIT 100`;
            }
        }

        const { rows } = await db.query(query, values);

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        console.error('List students error:', error);
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

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            admission_no, student_name, father_name, mother_name, dob,
            class_id, section_id, academic_year_id,
            admission_date, gender, blood_group, category,
            address, phone_no, emergency_no,
            aadhar_no, ppp_id, apaar_id, srn_no,
            board_roll_x, board_roll_xii, education_reg_no,
            stream, subject_count,
            is_new_student
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

            const tenantForInsertion = user.role === UserRole.SUPER_ADMIN && body.tenant_id ? parseInt(body.tenant_id) : user.tenant_id;

            const existingCheck = await client.query('SELECT id FROM students WHERE admission_no = $1 AND tenant_id = $2', [admission_no, tenantForInsertion]);
            if (existingCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error_code: 'DUPLICATE_ADMISSION_NO', message: 'Admission number already exists in this school' },
                    { status: 400 }
                );
            }

            const currentYear = new Date().getFullYear();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const student_code = `SC${currentYear}${randomSuffix}`;

            const insertStudentQuery = `
                INSERT INTO students (
                    admission_no, student_code, student_name, father_name, mother_name, dob, admission_date,
                    gender, blood_group, category, address, phone_no, emergency_no,
                    aadhar_no, ppp_id, apaar_id, srn_no, board_roll_x, board_roll_xii, education_reg_no,
                    stream, subject_count, is_new_student, tenant_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
                RETURNING id;
            `;

            const studentRes = await client.query(insertStudentQuery, [
                admission_no, student_code, student_name, father_name, mother_name || '', dob,
                admission_date ? new Date(admission_date) : new Date(),
                gender || 'Male', blood_group || '', category || 'General',
                address || '', phone_no || '', emergency_no || '',
                aadhar_no || '', ppp_id || '', apaar_id || '', srn_no || '',
                board_roll_x || '', board_roll_xii || '', education_reg_no || '',
                stream || null, subject_count || 5, is_new_student === true, tenantForInsertion
            ]);

            const studentId = studentRes.rows[0].id;

            if (class_id && section_id && academic_year_id) {
                await client.query(`
                    INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, tenant_id)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (student_id, academic_year_id, tenant_id) DO UPDATE SET class_id = EXCLUDED.class_id, section_id = EXCLUDED.section_id
                `, [studentId, class_id, section_id, academic_year_id, tenantForInsertion]);
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
