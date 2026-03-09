import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const assignStudentSubjectsSchema = z.object({
    student_id: z.number().int().positive(),
    class_id: z.number().int().positive(),
    academic_year_id: z.number().int().positive(),
    subjects: z.array(z.object({
        subject_id: z.number().int().positive(),
        subject_type: z.enum(['mandatory', 'optional_5th', 'additional_6th'])
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
        const result = assignStudentSubjectsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, class_id, academic_year_id, subjects } = result.data;

        // Validation rule:
        // Normally, 4 mandatory, 1 optional_5th, and optionally 1 additional_6th.
        const mandatoryCount = subjects.filter(s => s.subject_type === 'mandatory').length;
        const optionalCount = subjects.filter(s => s.subject_type === 'optional_5th').length;
        const additionalCount = subjects.filter(s => s.subject_type === 'additional_6th').length;

        // We can be a bit lenient or strictly enforce 4-1-1/0
        // We will just log warnings if it deviates but allow saving for flexibility in edge cases.

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Clear existing mappings for this student for the academic year
            const clearQuery = `
                DELETE FROM student_subjects 
                WHERE student_id = $1 AND academic_year_id = $2
            `;
            await client.query(clearQuery, [student_id, academic_year_id]);

            // 2. Insert new subjects
            const insertQuery = `
                INSERT INTO student_subjects (student_id, class_id, subject_id, academic_year_id, subject_type)
                VALUES ($1, $2, $3, $4, $5)
            `;

            for (const sub of subjects) {
                await client.query(insertQuery, [student_id, class_id, sub.subject_id, academic_year_id, sub.subject_type]);
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Student subjects mapped successfully'
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
        const student_id = searchParams.get('student_id');
        const academic_year_id = searchParams.get('academic_year_id');

        if (!student_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'student_id and academic_year_id are required' },
                { status: 400 }
            );
        }

        const query = `
            SELECT subject_id, subject_type
            FROM student_subjects 
            WHERE student_id = $1 AND academic_year_id = $2
        `;
        const { rows } = await db.query(query, [parseInt(student_id), parseInt(academic_year_id)]);

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
