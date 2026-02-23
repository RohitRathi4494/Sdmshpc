import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET: List all office staff
export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { rows } = await db.query(`
            SELECT id, username, full_name, is_active, created_at
            FROM users
            WHERE role = 'OFFICE'
            ORDER BY full_name ASC
        `);

        return NextResponse.json({ success: true, data: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST: Create new office staff account
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { username, password, full_name } = await request.json();

        if (!username || !password || !full_name) {
            return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
        }

        // Check username uniqueness
        const check = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const { rows } = await db.query(`
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, 'OFFICE', true)
            RETURNING id, username, full_name, is_active, created_at
        `, [username, passwordHash, full_name]);

        return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
