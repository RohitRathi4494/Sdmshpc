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
        const term = searchParams.get('term'); // Term Name like 'Term I'

        if (!academic_year_id || !class_id) {
            return NextResponse.json({ error: 'academic_year_id and class_id are required' }, { status: 400 });
        }

        let query = `
            SELECT
                st.student_name,
                AVG(sc.marks) AS avg_score
            FROM scholastic_scores sc
            JOIN students st ON st.id = sc.student_id
            JOIN student_enrollments se ON se.student_id = st.id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND sc.academic_year_id = $2
              AND sc.marks IS NOT NULL
        `;
        const params: any[] = [class_id, academic_year_id];

        if (section_id) {
            params.push(section_id);
            query += ` AND se.section_id = $${params.length}`;
        }

        if (term) {
            params.push(term);
            query += ` AND sc.term_id = (SELECT id FROM terms WHERE term_name = $${params.length})`;
        }

        query += ` GROUP BY st.student_name ORDER BY avg_score DESC LIMIT 10;`;

        const result = await db.query(query, params);

        const formatted = result.rows.map((row, index) => ({
            rank: index + 1,
            student: row.student_name,
            score: parseFloat(row.avg_score).toFixed(1)
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Failed to get top students:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
