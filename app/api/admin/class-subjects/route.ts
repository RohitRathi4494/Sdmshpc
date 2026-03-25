import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const assignSubjectsSchema = z.object({
    class_id: z.number().int().positive(),
    section_id: z.number().int().positive().optional().nullable(),
    academic_year_id: z.number().int().positive(),
    subjects: z.array(z.object({
        subject_id: z.number().int().positive(),
        max_marks: z.number().int().positive().default(100),
        assessment_max_marks: z.record(z.coerce.number()).optional().default({}),
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

        const { class_id, section_id, academic_year_id, subjects } = result.data;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Clear existing for this class+section+year combination
            if (section_id) {
                await client.query(
                    `DELETE FROM class_subjects WHERE class_id = $1 AND academic_year_id = $2 AND section_id = $3 AND tenant_id = $4`,
                    [class_id, academic_year_id, section_id, user.tenant_id]
                );
            } else {
                // Clear class-level (section_id IS NULL)
                await client.query(
                    `DELETE FROM class_subjects WHERE class_id = $1 AND academic_year_id = $2 AND section_id IS NULL AND tenant_id = $3`,
                    [class_id, academic_year_id, user.tenant_id]
                );
            }

            const insertQuery = `
                INSERT INTO class_subjects (class_id, section_id, academic_year_id, subject_id, max_marks, assessment_max_marks, display_order, is_active, tenant_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
            `;

            for (const sub of subjects) {
                await client.query(insertQuery, [
                    class_id,
                    section_id || null,
                    academic_year_id,
                    sub.subject_id,
                    sub.max_marks,
                    JSON.stringify(sub.assessment_max_marks || {}),
                    sub.display_order || 0,
                    user.tenant_id
                ]);
            }

            await client.query('COMMIT');
            return NextResponse.json({ success: true, message: 'Subjects assigned successfully' });

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

        if (!user) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id');
        const academic_year_id = searchParams.get('academic_year_id');

        if (!class_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'class_id and academic_year_id are required' },
                { status: 400 }
            );
        }

        let query: string;
        let params: any[];

        if (section_id) {
            // Return section-specific subjects; fall back to class-level if none found
            query = `
                SELECT subject_id, max_marks, assessment_max_marks, display_order, section_id
                FROM class_subjects 
                WHERE class_id = $1 AND academic_year_id = $2 AND section_id = $3 AND tenant_id = $4
            `;
            params = [parseInt(class_id), parseInt(academic_year_id), parseInt(section_id), user.tenant_id];
            const { rows } = await db.query(query, params);

            if (rows.length > 0) {
                return NextResponse.json({ success: true, data: rows });
            }

            // Fall back to class-level (section_id IS NULL)
            query = `
                SELECT subject_id, max_marks, assessment_max_marks, display_order, section_id
                FROM class_subjects 
                WHERE class_id = $1 AND academic_year_id = $2 AND section_id IS NULL AND tenant_id = $3
            `;
            params = [parseInt(class_id), parseInt(academic_year_id), user.tenant_id];
        } else {
            // Return class-level subjects (section_id IS NULL) for mapping page
            query = `
                SELECT subject_id, max_marks, assessment_max_marks, display_order, section_id
                FROM class_subjects 
                WHERE class_id = $1 AND academic_year_id = $2 AND section_id IS NULL AND tenant_id = $3
            `;
            params = [parseInt(class_id), parseInt(academic_year_id), user.tenant_id];
        }

        const { rows } = await db.query(query, params);
        return NextResponse.json({ success: true, data: rows });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
