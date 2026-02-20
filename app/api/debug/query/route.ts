import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Test the exact query that is failing
        // We will hardcode academic_year_id to 1 (or whatever is active in Prod) just to test the query structure
        // Actually, let's fetch active year first
        const yearRes = await db.query('SELECT id FROM academic_years WHERE is_active = true LIMIT 1');
        const activeYearId = yearRes.rows[0]?.id;

        if (!activeYearId) {
            return NextResponse.json({ success: false, message: 'No active year found in DB' });
        }

        const query = `
            SELECT s.*, se.roll_no, se.section_id, c.class_name
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id
            JOIN classes c ON se.class_id = c.id
            WHERE se.academic_year_id = $1
            ORDER BY c.display_order ASC, s.student_name ASC
        `;

        const students = await db.query(query, [activeYearId]);

        return NextResponse.json({
            success: true,
            count: students.rows.length,
            sample: students.rows[0]
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
