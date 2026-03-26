export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE && user.role !== UserRole.SUPER_ADMIN)) {
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

        const tenantClause = is_global_search ? '1=1' : `c.tenant_id = $1`;
        let values: any[] = is_global_search ? [] : [effective_tenant_id];

        const query = `
            SELECT c.*, t.school_code 
            FROM classes c
            JOIN tenants t ON c.tenant_id = t.id
            WHERE ${tenantClause}
            ORDER BY c.display_order ASC
        `;
        const { rows } = await db.query(query, values);

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

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { class_name, display_order } = body;
        const tenant_id = (user.role === UserRole.SUPER_ADMIN && body.tenant_id) ? parseInt(body.tenant_id) : user.tenant_id;

        if (!class_name) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Class name is required' },
                { status: 400 }
            );
        }

        const query = 'INSERT INTO classes (class_name, display_order, tenant_id) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await db.query(query, [class_name, display_order || 0, tenant_id]);

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        console.error('Error creating class:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
