import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { z } from 'zod';
import { db } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

// ─── Feature flag ────────────────────────────────────────────────────────────
// Set to true when the office portal is ready to use again.
const OFFICE_PORTAL_ENABLED = false;
// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    school_code: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = loginSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid input' },
                { status: 400 }
            );
        }

        const { school_code, username, password } = result.data;

        // 1. Query Tenant
        const tenantQuery = 'SELECT id, is_active FROM tenants WHERE school_code = $1';
        const { rows: tenantRows } = await db.query(tenantQuery, [school_code]);
        const tenant = tenantRows[0];

        if (!tenant) {
            return NextResponse.json(
                { success: false, error_code: 'AUTH_FAILED', message: 'Invalid School Code' },
                { status: 401 }
            );
        }

        // If you implement tenant deactivation later
        if (tenant.is_active === false) {
            return NextResponse.json(
                { success: false, error_code: 'TENANT_INACTIVE', message: 'School account is inactive' },
                { status: 403 }
            );
        }

        // 2. Query user from DB within that tenant
        const query = 'SELECT id, username, password_hash, role, full_name, is_active, tenant_id FROM users WHERE username = $1 AND tenant_id = $2';
        const { rows } = await db.query(query, [username, tenant.id]);
        const user = rows[0];

        if (!user) {
            return NextResponse.json(
                { success: false, error_code: 'AUTH_FAILED', message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (!user.is_active) {
            return NextResponse.json(
                { success: false, error_code: 'ACCOUNT_LOCKED', message: 'Account is inactive' },
                { status: 403 }
            );
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return NextResponse.json(
                { success: false, error_code: 'AUTH_FAILED', message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Block OFFICE logins while portal is disabled
        if (user.role === 'OFFICE' && !OFFICE_PORTAL_ENABLED) {
            return NextResponse.json(
                { success: false, error_code: 'PORTAL_DISABLED', message: 'The Office Portal is temporarily unavailable. Please contact the administrator.' },
                { status: 403 }
            );
        }

        // Create JWT
        const token = await new SignJWT({
            user_id: user.id.toString(),
            role: user.role,
            tenant_id: user.tenant_id
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(SECRET_KEY);

        return NextResponse.json({
            success: true,
            token,
            role: user.role,
            user_id: user.id,
            tenant_id: user.tenant_id,
            full_name: user.full_name
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: `Server Error: ${error.message}` },
            { status: 500 }
        );
    }
}
