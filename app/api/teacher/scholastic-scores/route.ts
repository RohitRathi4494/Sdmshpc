import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const scoreSchema = z.object({
    student_id: z.number().int().positive(),
    subject_id: z.number().int().positive(),
    component_id: z.number().int().positive(),
    term_id: z.number().int().positive(),
    marks: z.number().nullable().optional(),
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

        // Strategy: Try saving WITHOUT grade first (assuming schema is fixed).
        // If it fails with "null value in column grade", retry WITH grade.

        try {
            const queryNoGrade = `
                INSERT INTO scholastic_scores (student_id, subject_id, component_id, term_id, marks, academic_year_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (student_id, subject_id, component_id, term_id, academic_year_id)
                DO UPDATE SET marks = EXCLUDED.marks
                RETURNING id
            `;
            const { rows } = await db.query(queryNoGrade, [student_id, subject_id, component_id, term_id, marks ?? null, academic_year_id]);
            return NextResponse.json({ success: true, data: rows[0] });

        } catch (err: any) {
            // Check for specific "not-null constraint" error on "grade" column
            if (err.message && err.message.includes('null value in column "grade"') && err.message.includes('not-null constraint')) {
                // FALLBACK: The DB still requires a grade. Calculate and insert it.
                console.warn('Database requires Grade. Switching to fallback insert with calculated grade.');

                let grade = 'E'; // Default
                if (marks !== null && marks !== undefined) {
                    const compRes = await db.query('SELECT max_marks FROM assessment_components WHERE id = $1', [component_id]);
                    const maxMarks = compRes.rows[0]?.max_marks || 100;
                    const percentage = (marks / maxMarks) * 100;
                    grade = calculateGrade(percentage);
                } else {
                    grade = 'AB'; // Absent/Null
                }

                const queryWithGrade = `
                    INSERT INTO scholastic_scores (student_id, subject_id, component_id, term_id, marks, grade, academic_year_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (student_id, subject_id, component_id, term_id, academic_year_id)
                    DO UPDATE SET marks = EXCLUDED.marks, grade = EXCLUDED.grade
                    RETURNING id
                `;
                const { rows } = await db.query(queryWithGrade, [student_id, subject_id, component_id, term_id, marks ?? null, grade, academic_year_id]);
                return NextResponse.json({ success: true, data: rows[0] });
            } else {
                throw err; // Re-throw real errors
            }
        }

    } catch (error: any) {
        console.error('Database Error in POST scholastic-scores:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
