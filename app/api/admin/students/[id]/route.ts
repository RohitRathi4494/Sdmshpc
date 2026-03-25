
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const studentId = parseInt(params.id);
        const body = await request.json();
        const {
            student_name, father_name, mother_name, dob, admission_no,
            // New Fields
            admission_date, blood_group, gender, address, phone_no, emergency_no,
            category, ppp_id, apaar_id, aadhar_no,
            board_roll_x, board_roll_xii, education_reg_no, srn_no,
            // Senior Secondary
            stream, subject_count,
            // Fee Flag
            is_new_student,
            // Enrollment
            roll_no, section_id, academic_year_id
        } = body;

        // Start transaction (simulated with sequential queries)
        const dobValue = dob ? new Date(dob) : null;
        const admissionDateValue = admission_date ? new Date(admission_date) : null;

        await db.query(`
            UPDATE students 
            SET student_name = $1, father_name = $2, mother_name = $3, dob = $4, admission_no = $5,
                admission_date = COALESCE($7, admission_date), 
                blood_group = $8, gender = $9, address = $10, phone_no = $11, emergency_no = $12,
                category = $13, ppp_id = $14, apaar_id = $15, aadhar_no = $16,
                board_roll_x = $17, board_roll_xii = $18, education_reg_no = $19, srn_no = $20,
                stream = $21, subject_count = $22, is_new_student = $23
            WHERE id = $6 AND tenant_id = $24
        `, [
            student_name, father_name, mother_name, dobValue, admission_no, parseInt(params.id),
            admissionDateValue, blood_group, gender, address, phone_no, emergency_no,
            category, ppp_id, apaar_id, aadhar_no,
            board_roll_x, board_roll_xii, education_reg_no, srn_no,
            stream || null, subject_count || 5, is_new_student === true, user.tenant_id
        ]);

        // 2. Update Enrollment Info if academic_year_id is provided
        if (academic_year_id) {
            const existing = await db.query(`
                SELECT id FROM student_enrollments 
                WHERE student_id = $1 AND academic_year_id = $2 AND tenant_id = $3
            `, [studentId, academic_year_id, user.tenant_id]);

            if (existing.rows.length > 0) {
                if (section_id) {
                    // Derive class_id from the chosen section so it stays in sync
                    await db.query(`
                        UPDATE student_enrollments
                        SET roll_no = $1,
                            section_id = $2,
                            class_id = (SELECT class_id FROM sections WHERE id = $2 AND tenant_id = $5)
                        WHERE student_id = $3 AND academic_year_id = $4 AND tenant_id = $5
                    `, [roll_no, section_id, studentId, academic_year_id, user.tenant_id]);
                } else {
                    // Only roll_no changed
                    await db.query(`
                        UPDATE student_enrollments
                        SET roll_no = $1
                        WHERE student_id = $2 AND academic_year_id = $3 AND tenant_id = $4
                    `, [roll_no, studentId, academic_year_id, user.tenant_id]);
                }
            } else if (section_id) {
                await db.query(`
                    INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_no, tenant_id)
                    SELECT $1, s.class_id, $2, $3, $4, $5
                    FROM sections s WHERE s.id = $2 AND s.tenant_id = $5
                 `, [studentId, section_id, academic_year_id, roll_no, user.tenant_id]);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Student updated successfully'
        });

    } catch (error: any) {
        console.error('Update Error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        // Only ADMIN can delete students
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Only Admins can delete students' },
                { status: 403 }
            );
        }

        const studentId = parseInt(params.id);
        if (isNaN(studentId)) {
            return NextResponse.json(
                { success: false, error_code: 'INVALID_REQUEST', message: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Hard delete from students table. 
            // Postgres ON DELETE CASCADE shouldn't leave orphan records in enrollments, fees, attendance, scores etc.
            const result = await client.query('DELETE FROM students WHERE id = $1 AND tenant_id = $2 RETURNING id', [studentId, user.tenant_id]);

            if (result.rowCount === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { success: false, error_code: 'NOT_FOUND', message: 'Student not found' },
                    { status: 404 }
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Student completely removed from the database'
            });

        } catch (e: any) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Delete student error:', error);
        return NextResponse.json(
            { success: false, error_code: 'SERVER_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
