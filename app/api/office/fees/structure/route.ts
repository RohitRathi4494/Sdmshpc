
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// GET Fee Structures (optional filter by class or year)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('class_id');
        const yearId = searchParams.get('academic_year_id');

        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        let query = `
            SELECT fs.*, fh.head_name, c.class_name, ay.year_name
            FROM fee_structures fs
            JOIN fee_heads fh ON fs.fee_head_id = fh.id
            JOIN classes c ON fs.class_id = c.id
            JOIN academic_years ay ON fs.academic_year_id = ay.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (classId) {
            params.push(classId);
            query += ` AND fs.class_id = $${params.length}`;
        }
        if (yearId) {
            params.push(yearId);
            query += ` AND fs.academic_year_id = $${params.length}`;
        }

        // Order by Class, then specificity (Stream/Count), then Due Date
        // More specific rules (with stream/subject_count) should ideally appear distinct
        query += ` ORDER BY c.display_order, fs.stream NULLS LAST, fs.subject_count NULLS LAST, fs.due_date`;

        const result = await db.query(query, params);
        return NextResponse.json({ success: true, data: result.rows });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// ASSIGN Fee to Class (Create Structure)
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count } = body;

        if (!class_id || !academic_year_id || !fee_head_id || !amount) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Prepare values regarding nulls for the unique index check concept
        // However, simple INSERT ... ON CONFLICT may fail if the index expression isn't matched perfectly.
        // We will try a standard INSERT; if it fails due to unique constraint, we UPDATE.
        // Or better: Checking existence first or DELETE then INSERT (simple for configuration).
        // Let's try the robust UPSERT using the constraint name if known, OR just raw INSERT and handle error.

        // Actually, for simplicity and reliability with the custom index:
        // We can execute a DELETE for the exact combination first, then INSERT.
        // This avoids "ON CONFLICT" syntax headache with NULLs/COALESCE indexes.

        await db.query(`
            DELETE FROM fee_structures 
            WHERE class_id = $1 
              AND academic_year_id = $2 
              AND fee_head_id = $3
              AND (stream IS NOT DISTINCT FROM $4)
              AND (subject_count IS NOT DISTINCT FROM $5)
        `, [class_id, academic_year_id, fee_head_id, stream || null, subject_count || null]);

        const result = await db.query(
            `INSERT INTO fee_structures (class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [class_id, academic_year_id, fee_head_id, amount, due_date || null, stream || null, subject_count || null]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
