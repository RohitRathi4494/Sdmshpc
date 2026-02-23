import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// PUT: Update office staff (name / active / reset password)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const staffId = parseInt(params.id);
        const { full_name, password, is_active } = await request.json();

        let query = 'UPDATE users SET ';
        const values: any[] = [];
        let idx = 1;

        if (full_name) { query += `full_name = $${idx++}, `; values.push(full_name); }
        if (is_active !== undefined) { query += `is_active = $${idx++}, `; values.push(is_active); }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query += `password_hash = $${idx++}, `;
            values.push(hash);
        }

        if (values.length === 0) {
            return NextResponse.json({ success: false, message: 'No changes provided' }, { status: 400 });
        }

        query = query.slice(0, -2); // remove trailing ", "
        query += ` WHERE id = $${idx} AND role = 'OFFICE' RETURNING id, username, full_name, is_active`;
        values.push(staffId);

        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Staff member not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
