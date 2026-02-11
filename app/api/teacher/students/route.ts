import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id'); // Optional? Contract implies both.
        const academic_year_id = searchParams.get('academic_year_id');

        if (!class_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing class_id or academic_year_id' },
                { status: 400 }
            );
        }

        // Join students and enrollments
        let query = `
      SELECT s.id, s.admission_no, s.student_name, s.father_name, se.roll_no
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      WHERE se.class_id = $1 AND se.academic_year_id = $2
    `;
        const params: any[] = [class_id, academic_year_id];

        if (section_id) {
            query += ` AND se.section_id = $3`;
            params.push(section_id);
        }

        query += ` ORDER BY se.roll_no ASC, s.student_name ASC`;

        const { rows } = await db.query(query, params);

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
