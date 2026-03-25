import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const subjectSchema = z.object({
    subject_name: z.string().min(2).max(100),
});

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

        const query = 'SELECT * FROM subjects WHERE tenant_id = $1 ORDER BY subject_name ASC';
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

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const result = subjectSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) }, { status: 400 });
        }

        const { subject_name } = result.data;

        // Check duplicate
        const check = await db.query('SELECT id FROM subjects WHERE subject_name = $1 AND tenant_id = $2', [subject_name, user.tenant_id]);
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, error_code: 'DUPLICATE', message: 'Subject already exists' }, { status: 400 });
        }

        const { rows } = await db.query(
            'INSERT INTO subjects (subject_name, tenant_id) VALUES ($1, $2) RETURNING *',
            [subject_name, user.tenant_id]
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
        if (!user || user.role !== UserRole.ADMIN) return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });

        const body = await request.json();
        const { id, subject_name } = body;

        if (!id || !subject_name) {
            return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: 'ID and Name required' }, { status: 400 });
        }

        const { rows } = await db.query(
            'UPDATE subjects SET subject_name = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
            [subject_name, id, user.tenant_id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error_code: 'NOT_FOUND', message: 'Subject not found' }, { status: 404 });
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
        if (!user || user.role !== UserRole.ADMIN) return NextResponse.json({ success: false, error_code: 'FORBIDDEN', message: 'Access denied' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error_code: 'VALIDATION_ERROR', message: 'ID required' }, { status: 400 });

        // Check dependencies
        const check = await db.query('SELECT id FROM class_subjects WHERE subject_id = $1 AND tenant_id = $2 LIMIT 1', [id, user.tenant_id]);
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, error_code: 'DEPENDENCY', message: 'Cannot delete subject assigned to a class' }, { status: 400 });
        }

        await db.query('DELETE FROM subjects WHERE id = $1 AND tenant_id = $2', [id, user.tenant_id]);

        return NextResponse.json({ success: true, message: 'Subject deleted' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error_code: 'DB_ERROR', message: error.message }, { status: 500 });
    }
}
