import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const assignSubjectsSchema = z.object({
    class_id: z.number().int().positive(),
    academic_year_id: z.number().int().positive(),
    subjects: z.array(z.object({
        subject_id: z.number().int().positive(),
        max_marks: z.number().int().positive().default(100),
        display_order: z.number().int().optional().default(0)
    })),
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
        const result = assignSubjectsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { class_id, academic_year_id, subjects } = result.data;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const clearQuery = `
        DELETE FROM class_subjects 
        WHERE class_id = $1 AND academic_year_id = $2
      `;
            await client.query(clearQuery, [class_id, academic_year_id]);

            const insertQuery = `
        INSERT INTO class_subjects (class_id, academic_year_id, subject_id, max_marks, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `;

            for (const sub of subjects) {
                await client.query(insertQuery, [class_id, academic_year_id, sub.subject_id, sub.max_marks, sub.display_order || 0]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Subjects assigned successfully'
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

        const { searchParams } = new URL(request.url);
        const class_id = searchParams.get('class_id');
        const academic_year_id = searchParams.get('academic_year_id');

        if (!class_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'class_id and academic_year_id are required' },
                { status: 400 }
            );
        }

        const query = `
            SELECT subject_id, max_marks, display_order
            FROM class_subjects 
            WHERE class_id = $1 AND academic_year_id = $2
        `;
        const { rows } = await db.query(query, [parseInt(class_id), parseInt(academic_year_id)]);

        // Return array of objects with id and max_marks
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
