import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';
import { z } from 'zod';

const reasonSchema = z.object({
    student_id: z.number().int().positive(),
    reason_for_low_attendance: z.string().nullable().optional(),
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
        const result = reasonSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: JSON.stringify(result.error.flatten()) },
                { status: 400 }
            );
        }

        const { student_id, reason_for_low_attendance, academic_year_id } = result.data;

        // Update all existing attendance records for this student and academic year
        const query = `
            UPDATE attendance_records 
            SET reason_for_low_attendance = $1 
            WHERE student_id = $2 AND academic_year_id = $3
        `;

        await db.query(query, [reason_for_low_attendance, student_id, academic_year_id]);

        return NextResponse.json({
            success: true,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
