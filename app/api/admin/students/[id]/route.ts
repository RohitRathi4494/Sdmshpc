
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
                board_roll_x = $17, board_roll_xii = $18, education_reg_no = $19, srn_no = $20
            WHERE id = $6
        `, [
            student_name, father_name, mother_name, dobValue, admission_no, studentId,
            admissionDateValue, blood_group, gender, address, phone_no, emergency_no,
            category, ppp_id, apaar_id, aadhar_no,
            board_roll_x, board_roll_xii, education_reg_no, srn_no
        ]);

        // 2. Update Enrollment Info if academic_year_id is provided
        if (academic_year_id) {
            // Check if enrollment exists
            const existing = await db.query(`
                SELECT id FROM student_enrollments 
                WHERE student_id = $1 AND academic_year_id = $2
            `, [studentId, academic_year_id]);

            if (existing.rows.length > 0) {
                await db.query(`
                    UPDATE student_enrollments
                    SET roll_no = $1, section_id = $2
                    WHERE student_id = $3 AND academic_year_id = $4
                `, [roll_no, section_id, studentId, academic_year_id]);
            } else if (section_id) {
                // Insert logic if missing
                await db.query(`
                    INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_no)
                    SELECT $1, s.class_id, $2, $3, $4
                    FROM sections s WHERE s.id = $2
                 `, [studentId, section_id, academic_year_id, roll_no]);
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
