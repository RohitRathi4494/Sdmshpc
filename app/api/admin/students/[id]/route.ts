
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

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const studentId = parseInt(params.id);
        const body = await request.json();
        const { student_name, father_name, mother_name, dob, admission_no, roll_no, section_id, academic_year_id } = body;

        // Start transaction (simulated with sequential queries for now as db client might not support explicit tx easily without pool)
        // 1. Update Student Basic Info
        // Handle optional DOB
        const dobValue = dob ? new Date(dob) : null;

        await db.query(`
            UPDATE students 
            SET student_name = $1, father_name = $2, mother_name = $3, dob = $4, admission_no = $5
            WHERE id = $6
        `, [student_name, father_name, mother_name, dobValue, admission_no, studentId]);

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
            } else {
                // Insert if for some reason missing (though this is an update)
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
