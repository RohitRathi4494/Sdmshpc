import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
    userId: z.number().int().positive(),
    username: z.string().min(3).max(50),
    full_name: z.string().min(2).max(100),
    password: z.string().min(6).optional().or(z.literal('')),
    is_active: z.boolean().optional()
});

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied: Super Admin only' },
                { status: 403 }
            );
        }

        const query = `
            SELECT 
                u.id, u.username, u.full_name, u.role, u.is_active, u.created_at, 
                t.id as tenant_id, t.school_name, t.school_code 
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.role IN ('ADMIN', 'OFFICE')
            ORDER BY t.id ASC, u.role ASC
        `;
        const { rows } = await db.query(query);

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        console.error('Fetch system users error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied: Super Admin only' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const result = updateUserSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid payload configuration' },
                { status: 400 }
            );
        }

        const { userId, username, full_name, password, is_active } = result.data;

        // Verify target user is actually an ADMIN or OFFICE user (prevent modifying other roles or Super Admin)
        const checkQuery = `SELECT id, role, tenant_id FROM users WHERE id = $1 AND role IN ('ADMIN', 'OFFICE')`;
        const checkRes = await db.query(checkQuery, [userId]);
        
        if (checkRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Target user not found or cannot be modified.' },
                { status: 404 }
            );
        }
        
        const targetTenantId = checkRes.rows[0].tenant_id;

        // Ensure username is not taken by another user in the same tenant
        const duplicateCheck = await db.query(
            'SELECT id FROM users WHERE username = $1 AND tenant_id = $2 AND id != $3', 
            [username, targetTenantId, userId]
        );
        if (duplicateCheck.rows.length > 0) {
            return NextResponse.json(
                { success: false, error_code: 'DUPLICATE', message: 'Username is already taken in this branch.' },
                { status: 400 }
            );
        }

        let updateQuery = `UPDATE users SET username = $1, full_name = $2, is_active = $3`;
        let values: any[] = [username, full_name, is_active !== undefined ? is_active : true];
        let paramIndex = 4;

        if (password && password.trim().length > 0) {
            const passwordHash = await bcrypt.hash(password, 10);
            updateQuery += `, password_hash = $${paramIndex}`;
            values.push(passwordHash);
            paramIndex++;
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING id, username, full_name, role, is_active`;
        values.push(userId);

        const { rows } = await db.query(updateQuery, values);

        return NextResponse.json({
            success: true,
            data: rows[0],
            message: 'User credentials updated successfully'
        });

    } catch (error: any) {
        console.error('Update system user error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
