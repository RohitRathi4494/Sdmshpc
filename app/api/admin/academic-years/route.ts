import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const createYearSchema = z.object({
    year_name: z.string().min(1),
    is_active: z.boolean().optional(),
});

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
        const result = createYearSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: result.error.message },
                { status: 400 }
            );
        }

        const { year_name, is_active } = result.data;

        const query = `
      INSERT INTO academic_years (year_name, is_active)
      VALUES ($1, $2)
      RETURNING id, year_name, is_active
    `;
        const values = [year_name, is_active ?? false];

        const { rows } = await db.query(query, values);

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message || 'Database error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user) { // Allow VIEW_ONLY/TEACHER to list years? Assuming yes for context
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        const query = 'SELECT * FROM academic_years ORDER BY id DESC';
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
