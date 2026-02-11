import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// PUT: Update teacher (Reset Password / Toggle Active / Update Name)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const teacherId = parseInt(params.id);
        const body = await request.json();
        const { full_name, password, is_active } = body;

        // Dynamic update
        let query = 'UPDATE users SET ';
        const values = [];
        let valueIndex = 1;

        if (full_name) {
            query += `full_name = $${valueIndex}, `;
            values.push(full_name);
            valueIndex++;
        }

        if (is_active !== undefined) {
            query += `is_active = $${valueIndex}, `;
            values.push(is_active);
            valueIndex++;
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            query += `password_hash = $${valueIndex}, `;
            values.push(hash);
            valueIndex++;
        }

        // Remove trailing comma and space
        if (values.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NO_CHANGES', message: 'No changes provided' },
                { status: 400 }
            );
        }

        query = query.slice(0, -2);
        query += ` WHERE id = $${valueIndex} AND role = 'TEACHER' RETURNING id, username, full_name, is_active`;
        values.push(teacherId);

        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Teacher not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        console.error('Error updating teacher:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
