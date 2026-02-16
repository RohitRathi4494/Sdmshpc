
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// GET all fee heads
export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const result = await db.query('SELECT * FROM fee_heads ORDER BY id ASC');
        return NextResponse.json({ success: true, data: result.rows });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// CREATE new fee head
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { head_name } = body;

        if (!head_name) {
            return NextResponse.json({ success: false, message: 'Head name is required' }, { status: 400 });
        }

        const result = await db.query(
            'INSERT INTO fee_heads (head_name) VALUES ($1) RETURNING *',
            [head_name]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
