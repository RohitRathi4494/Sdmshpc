import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const updateYearSchema = z.object({
    year_name: z.string().min(1).optional(),
    is_active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const params = await context.params;
        const id = parseInt(params.id, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const result = updateYearSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: result.error.message },
                { status: 400 }
            );
        }

        const { year_name, is_active } = result.data;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // If setting to active, deactivate all others
            if (is_active === true) {
                await client.query('UPDATE academic_years SET is_active = false WHERE id != $1', [id]);
            }

            const updates = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (year_name !== undefined) {
                updates.push(`year_name = $${paramIndex++}`);
                values.push(year_name);
            }
            if (is_active !== undefined) {
                updates.push(`is_active = $${paramIndex++}`);
                values.push(is_active);
            }

            if (updates.length > 0) {
                values.push(id);
                const query = `
                    UPDATE academic_years 
                    SET ${updates.join(', ')} 
                    WHERE id = $${paramIndex}
                    RETURNING *
                `;
                const { rows } = await client.query(query, values);

                await client.query('COMMIT');

                if (rows.length === 0) {
                    return NextResponse.json(
                        { success: false, error_code: 'NOT_FOUND', message: 'Academic Year not found' },
                        { status: 404 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    data: rows[0],
                });
            } else {
                await client.query('COMMIT'); // No updates
                return NextResponse.json({
                    success: true,
                    message: "No changes requested"
                });
            }

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
