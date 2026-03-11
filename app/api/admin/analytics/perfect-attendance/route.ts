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
                st.student_name,
                SUM(ar.days_present) as total_present,
                SUM(ar.working_days) as total_working
            FROM students st
            JOIN student_enrollments se ON se.student_id = st.id
            JOIN attendance_records ar ON ar.student_id = st.id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND ar.academic_year_id = $2
        `;
        const params: any[] = [class_id, academic_year_id];

        if (section_id) {
            params.push(section_id);
            query += ` AND se.section_id = $${params.length}`;
        }

        query += ` 
            GROUP BY st.student_name
            HAVING SUM(ar.working_days) > 0 AND SUM(ar.days_present) = SUM(ar.working_days)
            ORDER BY st.student_name ASC;
        `;

        const result = await db.query(query, params);

        const formatted = result.rows.map(row => ({
            student: row.student_name
        }));

        return NextResponse.json({ success: true, data: formatted });

    } catch (error) {
        console.error('Failed to get perfect attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
