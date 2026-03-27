import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const createSectionSchema = z.object({
    class_id: z.number().int().positive(),
    section_name: z.string().min(1),
    class_teacher_id: z.number().int().positive().nullable().optional(),
    tenant_id: z.number().int().positive().optional(),
});

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
        const result = createSectionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { class_id, section_name, class_teacher_id } = result.data;
        const tenant_id = (user.role === UserRole.SUPER_ADMIN && body.tenant_id) ? parseInt(body.tenant_id) : user.tenant_id;

        const query = `
            INSERT INTO sections (class_id, section_name, class_teacher_id, tenant_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, class_id, section_name, class_teacher_id
        `;
        const { rows } = await db.query(query, [class_id, section_name, class_teacher_id || null, tenant_id]);

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

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
        const class_id = searchParams.get('class_id');
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

        const teacherTenantClause = is_global_search ? '1=1' : 'u.tenant_id = s.tenant_id';

        let query = `
            SELECT s.*, u.full_name as teacher_name, t.school_code
            FROM sections s
            LEFT JOIN users u ON s.class_teacher_id = u.id AND (${teacherTenantClause})
            JOIN tenants t ON s.tenant_id = t.id
            WHERE ${tenantClause}
        `;

        if (class_id) {
            query += ` AND s.class_id = $${values.length + 1}`;
            values.push(parseInt(class_id, 10));
        }

        query += ' ORDER BY s.section_name ASC';

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
