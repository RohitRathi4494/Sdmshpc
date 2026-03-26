import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const subjectSchema = z.object({
    subject_name: z.string().min(2).max(100),
    tenant_id: z.number().int().positive().optional(),
});

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
            } else {
                is_global_search = true;
            }
        }

        const tenantClause = is_global_search ? '1=1' : `s.tenant_id = $1`;
        let values: any[] = is_global_search ? [] : [effective_tenant_id];

        const query = `
            SELECT s.*, t.school_code 
            FROM subjects s
            JOIN tenants t ON s.tenant_id = t.id
            WHERE ${tenantClause} 
            ORDER BY s.subject_name ASC
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

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const result = subjectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) }, { status: 400 });
        }

        const { subject_name } = result.data;
        const tenant_id = (user.role === UserRole.SUPER_ADMIN && body.tenant_id) ? parseInt(body.tenant_id) : user.tenant_id;

        // Check duplicate
        const check = await db.query('SELECT id FROM subjects WHERE subject_name = $1 AND tenant_id = $2', [subject_name, tenant_id]);
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, error_code: 'DUPLICATE', message: 'Subject already exists in this school' }, { status: 400 });
        }

        const { rows } = await db.query(
            'INSERT INTO subjects (subject_name, tenant_id) VALUES ($1, $2) RETURNING *',
            [subject_name, tenant_id]
        );

        return NextResponse.json({ success: true, data: rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, error_code: 'DB_ERROR', message: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });

        const body = await request.json();
        const { id, subject_name } = body;

        if (!id || !subject_name) {
            return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: 'ID and Name required' }, { status: 400 });
        }

        const tenantClause = user.role === UserRole.SUPER_ADMIN ? '1=1' : `tenant_id = $3`;
        const values: any[] = [subject_name, id];
        if (user.role !== UserRole.SUPER_ADMIN) values.push(user.tenant_id);

        const { rows } = await db.query(
            `UPDATE subjects SET subject_name = $1 WHERE id = $2 AND ${tenantClause} RETURNING *`,
            values
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error_code: 'NOT_FOUND', message: 'Subject not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, error_code: 'DB_ERROR', message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: 'ID required' }, { status: 400 });

        const tenantClause = user.role === UserRole.SUPER_ADMIN ? '1=1' : `tenant_id = $2`;
        const values: any[] = [id];
        if (user.role !== UserRole.SUPER_ADMIN) values.push(user.tenant_id);

        // Check dependencies
        const check = await db.query(`SELECT id FROM class_subjects WHERE subject_id = $1 AND ${tenantClause} LIMIT 1`, values);
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, error_code: 'DEPENDENCY', message: 'Cannot delete subject assigned to a class' }, { status: 400 });
        }

        await db.query(`DELETE FROM subjects WHERE id = $1 AND ${tenantClause}`, values);

        return NextResponse.json({ success: true, message: 'Subject deleted' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error_code: 'DB_ERROR', message: error.message }, { status: 500 });
    }
}
