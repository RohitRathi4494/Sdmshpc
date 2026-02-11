import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const enrollStudentSchema = z.object({
    student_id: z.number().int().positive(),
    class_id: z.number().int().positive(),
    section_id: z.number().int().positive(),
    academic_year_id: z.number().int().positive(),
    roll_no: z.number().int().positive().optional(),
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
        const result = enrollStudentSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, class_id, section_id, academic_year_id, roll_no } = result.data;

        // Check if already enrolled in this year?
        const checkQuery = `
      SELECT id FROM student_enrollments 
      WHERE student_id = $1 AND academic_year_id = $2
    `;
        const checkResult = await db.query(checkQuery, [student_id, academic_year_id]);

        if (checkResult.rows.length > 0) {
            return NextResponse.json(
                { success: false, error_code: 'CONFLICT', message: 'Student already enrolled in this academic year' },
                { status: 409 }
            );
        }

        const insertQuery = `
      INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id, roll_no)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

        const { rows } = await db.query(insertQuery, [student_id, class_id, section_id, academic_year_id, roll_no || null]);

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
