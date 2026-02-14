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

function calculateGrade(percentage: number): string {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
}

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

        let grade = null;
        if (marks !== null && marks !== undefined) {
            // Fetch max marks for component to calculate percentage
            const compRes = await db.query('SELECT max_marks FROM assessment_components WHERE id = $1', [component_id]);
            const maxMarks = compRes.rows[0]?.max_marks || 100; // Default to 100 if not found (fallback)

            const percentage = (marks / maxMarks) * 100;
            grade = calculateGrade(percentage);
        } else {
            // Check if DB allows null grade by trying to insert a dummy if marks are null? No.
            // If marks are null (clearing), grade should be null.
            // If DB insists on NOT NULL grade even for null marks, we have a problem.
            // But usually valid marks => valid grade. Null marks => no record or null grade.
            // If the user's DB has NOT NULL on grade, then clearing marks (setting to null) might fail if we set grade to null.
            // But typically we don't store rows with null marks. We might DELETE them or store null.
            // This API uses UPSERT. If marks is null, we store null.
            // If grade is NOT NULL, we must store a string. Let's store '' or '-' for null marks if required.
            grade = null;
            // If the user's DB fails on NULL grade with NULL marks, we can use 'NA'.
            // But let's assume valid marks first.
        }

        // UPSERT Logic
        const query = `
      INSERT INTO scholastic_scores (student_id, subject_id, component_id, term_id, marks, grade, academic_year_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (student_id, subject_id, component_id, term_id, academic_year_id)
      DO UPDATE SET marks = EXCLUDED.marks, grade = EXCLUDED.grade
      RETURNING id
    `;

        const { rows } = await db.query(query, [student_id, subject_id, component_id, term_id, marks ?? null, grade, academic_year_id]);

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
