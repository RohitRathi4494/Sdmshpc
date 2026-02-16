
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

        query += ` ORDER BY c.display_order, fs.due_date`;

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
        const { class_id, academic_year_id, fee_head_id, amount, due_date } = body;

        if (!class_id || !academic_year_id || !fee_head_id || !amount) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const result = await db.query(
            `INSERT INTO fee_structures (class_id, academic_year_id, fee_head_id, amount, due_date)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (class_id, academic_year_id, fee_head_id) 
             DO UPDATE SET amount = EXCLUDED.amount, due_date = EXCLUDED.due_date
             RETURNING *`,
            [class_id, academic_year_id, fee_head_id, amount, due_date]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
