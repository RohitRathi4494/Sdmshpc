export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const query = 'SELECT * FROM classes WHERE tenant_id = $1 ORDER BY display_order ASC';
        const { rows } = await db.query(query, [user.tenant_id]);

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

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { class_name, display_order } = body;

        if (!class_name) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Class name is required' },
                { status: 400 }
            );
        }

        const query = 'INSERT INTO classes (class_name, display_order, tenant_id) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await db.query(query, [class_name, display_order || 0, user.tenant_id]);

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
