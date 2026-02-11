import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const attendanceSchema = z.object({
    student_id: z.number().int().positive(),
    month_id: z.number().int().positive(),
    working_days: z.number().int().nonnegative(),
    days_present: z.number().int().nonnegative(),
    academic_year_id: z.number().int().positive(),
});

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.TEACHER) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const result = attendanceSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, month_id, working_days, days_present, academic_year_id } = result.data;

        const query = `
      INSERT INTO attendance_records (student_id, month_id, working_days, days_present, academic_year_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, month_id, academic_year_id)
      DO UPDATE SET working_days = EXCLUDED.working_days, days_present = EXCLUDED.days_present
      RETURNING id
    `;

        const { rows } = await db.query(query, [student_id, month_id, working_days, days_present, academic_year_id]);

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
