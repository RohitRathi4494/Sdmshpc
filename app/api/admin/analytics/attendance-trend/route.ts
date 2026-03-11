import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('authorization'));
        const authUser = await verifyAuth(token);
        if (!authUser || authUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id');
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id');

        if (!academic_year_id || !class_id) {
            return NextResponse.json({ error: 'academic_year_id and class_id are required' }, { status: 400 });
        }

        let query = `
            SELECT
                m.month_name as month,
                m.display_order,
                SUM(ar.days_present)::float / SUM(ar.working_days) * 100 AS attendance_percentage
            FROM attendance_records ar
            JOIN student_enrollments se ON se.student_id = ar.student_id
            JOIN months m ON m.id = ar.month_id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND ar.academic_year_id = $2
        `;
        const params: any[] = [class_id, academic_year_id];

        if (section_id) {
            params.push(section_id);
            query += ` AND se.section_id = $${params.length}`;
        }

        query += ` GROUP BY m.month_name, m.display_order ORDER BY m.display_order ASC;`;

        const result = await db.query(query, params);

        const formatted = result.rows.map(row => ({
            month: row.month,
            percentage: parseFloat(row.attendance_percentage).toFixed(1)
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Failed to get attendance trend:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
