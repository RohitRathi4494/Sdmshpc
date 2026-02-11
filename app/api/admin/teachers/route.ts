import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// GET: List all teachers
export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const query = `
            SELECT id, username, full_name, role, is_active, created_at 
            FROM users 
            WHERE role = 'TEACHER' 
            ORDER BY created_at DESC
        `;
        const { rows } = await db.query(query);

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

// POST: Create a new teacher
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, password, full_name } = body;

        if (!username || !password || !full_name) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if username exists
        const check = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            return NextResponse.json(
                { success: false, error_code: 'DUPLICATE_USER', message: 'Username already exists' },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, 'TEACHER', true)
            RETURNING id, username, full_name, role, is_active, created_at
        `;

        const { rows } = await db.query(query, [username, passwordHash, full_name]);

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        console.error('Error creating teacher:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
