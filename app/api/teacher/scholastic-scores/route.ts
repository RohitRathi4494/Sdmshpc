import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const scoreSchema = z.object({
    student_id: z.number().int().positive(),
    subject_id: z.number().int().positive(),
    component_id: z.number().int().positive(),
    term_id: z.number().int().positive(),
    // grade removed
    marks: z.number().nullable().optional(), // Now effectively required logic-wise but keeping nullable for flexibility
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

        const { student_id, subject_id, component_id, term_id, marks, academic_year_id } = result.data;

        // UPSERT Logic
        const query = `
      INSERT INTO scholastic_scores (student_id, subject_id, component_id, term_id, marks, academic_year_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (student_id, subject_id, component_id, term_id, academic_year_id)
      DO UPDATE SET marks = EXCLUDED.marks
      RETURNING id
    `;

        const { rows } = await db.query(query, [student_id, subject_id, component_id, term_id, marks ?? null, academic_year_id]);

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        console.error('Database Error in POST scholastic-scores:', error); // Log exact error
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
