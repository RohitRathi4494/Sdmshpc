export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth';
import { getStudentClass } from '@/app/lib/assessment-lock-utils';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const academicYearId = searchParams.get('academic_year_id');
        let classId = searchParams.get('class_id');
        const studentId = searchParams.get('student_id');
        const termId = searchParams.get('term_id');

        if (!academicYearId || !termId) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing academic_year_id or term_id' },
                { status: 400 }
            );
        }

        if (!classId && studentId) {
            const resolvedClassId = await getStudentClass(parseInt(studentId), parseInt(academicYearId));
            if (resolvedClassId) {
                classId = resolvedClassId.toString();
            }
        }

        if (!classId) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing class_id or invalid student_id' },
                { status: 400 }
            );
        }

        const query = `
            SELECT component_id 
            FROM assessment_locks 
            WHERE academic_year_id = $1 
              AND class_id = $2 
              AND term_id = $3 
              AND is_locked = true
        `;
        const { rows } = await db.query(query, [academicYearId, classId, termId]);

        const lockedComponentIds = rows.map(r => r.component_id);

        return NextResponse.json({
            success: true,
            data: lockedComponentIds
        });

    } catch (error: any) {
        console.error("GET /api/teacher/assessment-locks error:", error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
