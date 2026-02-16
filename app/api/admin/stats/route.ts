
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            // Allow if it's just a quick check, but ideally protected. 
            // For dashboard verifyAuth is good.
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        // 1. Get Total Students (Active)
        // Assuming 'students' table has all students. 
        // We might want to filter by active enrollment in current year, but simple count is often enough for "Total Students".
        // Let's count all students for now, or maybe join with current academic year enrollments?
        // The prompt says "Total Students". Usually typically implies "Active Students".
        // Let's check if students has an 'is_active' flag?
        // Looking at previous `students` table structure in `app/api/parent/student/route.ts`:
        // It doesn't show is_active.
        // Let's count all rows in `students` for now.

        const studentsCountRes = await db.query('SELECT COUNT(*) FROM students');
        const totalStudents = parseInt(studentsCountRes.rows[0].count);

        // 2. Get Active Classes
        const classesCountRes = await db.query('SELECT COUNT(*) FROM classes');
        const totalClasses = parseInt(classesCountRes.rows[0].count);

        // 3. Current Session is already handled by frontend but we can return it too if needed.

        return NextResponse.json({
            success: true,
            data: {
                totalStudents,
                totalClasses
            }
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
