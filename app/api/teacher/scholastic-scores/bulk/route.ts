import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';
import { checkAssessmentLock, getStudentClass } from '@/app/lib/assessment-lock-utils';

const bulkScoreSchema = z.array(z.object({
    student_id: z.number().int().positive(),
    subject_id: z.number().int().positive(),
    component_id: z.number().int().positive(),
    term_id: z.number().int().positive(),
    // grade removed
    marks: z.number().nullable().optional(),
    academic_year_id: z.number().int().positive(),
}));

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
        const result = bulkScoreSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const scores = result.data;

        if (scores.length > 0) {
            const firstScore = scores[0];
            const classId = await getStudentClass(firstScore.student_id, firstScore.academic_year_id, user.tenant_id);
            if (classId) {
                const isLocked = await checkAssessmentLock(firstScore.academic_year_id, classId, firstScore.term_id, firstScore.component_id, user.tenant_id);
                if (isLocked) {
                    return NextResponse.json(
                        { success: false, error_code: 'ASSESSMENT_LOCKED', message: "This assessment has been locked by the administrator. Marks cannot be modified." },
                        { status: 403 }
                    );
                }
            }
        }

        // Transaction for bulk upsert
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
        INSERT INTO scholastic_scores (student_id, subject_id, component_id, term_id, marks, academic_year_id, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (student_id, subject_id, component_id, term_id, academic_year_id)
        DO UPDATE SET marks = EXCLUDED.marks
      `;

            for (const score of scores) {
                await client.query(query, [
                    score.student_id,
                    score.subject_id,
                    score.component_id,
                    score.term_id,
                    score.marks ?? null,
                    score.academic_year_id,
                    user.tenant_id
                ]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Bulk scores updated successfully'
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
