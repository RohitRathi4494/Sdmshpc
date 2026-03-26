import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// GET: List all teachers
export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const target_tenant_id = searchParams.get('tenant_id');

        // Tenant Isolation Logic
        let effective_tenant_id: number | null = user.tenant_id;
        let is_global_search = false;

        if (user.role === UserRole.SUPER_ADMIN) {
            if (target_tenant_id) {
                effective_tenant_id = parseInt(target_tenant_id);
                is_global_search = false;
            } else {
                is_global_search = true;
            }
        }

        const tenantClause = is_global_search ? '1=1' : `u.tenant_id = $1`;
        let values: any[] = is_global_search ? [] : [effective_tenant_id];

        const query = `
            SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.created_at, t.school_code 
            FROM users u
            JOIN tenants t ON u.tenant_id = t.id
            WHERE u.role = 'TEACHER' AND ${tenantClause}
            ORDER BY u.created_at DESC
        `;
        const { rows } = await db.query(query, values);

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        console.error('List teachers error:', error);
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

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, password, full_name } = body;
        const tenant_id = (user.role === UserRole.SUPER_ADMIN && body.tenant_id) ? parseInt(body.tenant_id) : user.tenant_id;

        if (!username || !password || !full_name) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if username exists within the target tenant
        const check = await db.query('SELECT id FROM users WHERE username = $1 AND tenant_id = $2', [username, tenant_id]);
        if (check.rows.length > 0) {
            return NextResponse.json(
                { success: false, error_code: 'DUPLICATE_USER', message: 'Username already exists in this school' },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password_hash, full_name, role, is_active, tenant_id)
            VALUES ($1, $2, $3, 'TEACHER', true, $4)
            RETURNING id, username, full_name, role, is_active, created_at
        `;

        const { rows } = await db.query(query, [username, passwordHash, full_name, tenant_id]);

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
