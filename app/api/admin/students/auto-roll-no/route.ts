
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { class_id, academic_year_id } = body;

        if (!class_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, message: 'Class ID and Academic Year ID are required' },
                { status: 400 }
            );
        }

        // 1. Fetch all students in the class for the academic year, sorted alphabetically
        const { rows: students } = await db.query(`
            SELECT s.id, s.student_name
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            WHERE se.class_id = $1 AND se.academic_year_id = $2
            ORDER BY s.student_name ASC
        `, [class_id, academic_year_id]);

        if (students.length === 0) {
            return NextResponse.json({ success: true, message: 'No students found to assign roll numbers' });
        }

        // 2. batch update roll numbers
        // Since we don't have a bulk update utility helper yet, we'll execute sequential updates.
        // For a school with ~40 students per class, this is negligible.
        const promises = students.map((student, index) => {
            const rollNo = index + 1;
            return db.query(`
                UPDATE student_enrollments
                SET roll_no = $1
                WHERE student_id = $2 AND class_id = $3 AND academic_year_id = $4
            `, [rollNo, student.id, class_id, academic_year_id]);
        });

        await Promise.all(promises);

        return NextResponse.json({
            success: true,
            message: `Roll numbers assigned to ${students.length} students`
        });

    } catch (error: any) {
        console.error('Auto Roll No Error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
