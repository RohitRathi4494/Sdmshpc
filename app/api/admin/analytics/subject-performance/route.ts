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
                s.subject_name,
                AVG(sc.marks) AS avg_marks
            FROM scholastic_scores sc
            JOIN subjects s ON s.id = sc.subject_id
            JOIN student_enrollments se ON se.student_id = sc.student_id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND sc.academic_year_id = $2
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

        // Only include non-null marks
        query += ` AND sc.marks IS NOT NULL GROUP BY s.subject_name ORDER BY avg_marks DESC;`;

        const result = await db.query(query, params);

        // Format for Recharts (parse numeric to float)
        const formatted = result.rows.map(row => ({
            subject: row.subject_name,
            average: parseFloat(row.avg_marks).toFixed(1)
        }));

        return NextResponse.json({ success: true, data: formatted });

    } catch (error) {
        console.error('Failed to get subject performance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
