import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const scoreSchema = z.object({
    student_id: z.number().int().positive(),
    sub_skill_id: z.number().int().positive(),
    term_id: z.number().int().positive(),
    grade: z.string().min(1),
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
        const result = scoreSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, sub_skill_id, term_id, grade, academic_year_id } = result.data;

        const query = `
      INSERT INTO co_scholastic_scores (student_id, sub_skill_id, term_id, grade, academic_year_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, sub_skill_id, term_id, academic_year_id)
      DO UPDATE SET grade = EXCLUDED.grade
      RETURNING id
    `;

        const { rows } = await db.query(query, [student_id, sub_skill_id, term_id, grade, academic_year_id]);

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
