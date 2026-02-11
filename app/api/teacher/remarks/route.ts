import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const remarkSchema = z.object({
    student_id: z.number().int().positive(),
    remark_type_id: z.number().int().positive(),
    aspect: z.string().nullable().optional(),
    remark_text: z.string().min(1),
    academic_year_id: z.number().int().positive(),
});

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const result = remarkSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, remark_type_id, aspect, remark_text, academic_year_id } = result.data;

        // Custom UPSERT logic via Delete-Insert because of composite key with nullable field and no unique constraint
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete existing for THIS slot
            // "IS NOT DISTINCT FROM" treats NULLs as equal
            const deleteQuery = `
        DELETE FROM remarks 
        WHERE student_id = $1 
          AND remark_type_id = $2 
          AND academic_year_id = $3
          AND aspect IS NOT DISTINCT FROM $4
      `;
            await client.query(deleteQuery, [student_id, remark_type_id, academic_year_id, aspect ?? null]);

            // 2. Insert new
            const insertQuery = `
        INSERT INTO remarks (student_id, remark_type_id, aspect, remark_text, academic_year_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
            const { rows } = await client.query(insertQuery, [student_id, remark_type_id, aspect ?? null, remark_text, academic_year_id]);

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                data: rows[0],
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
