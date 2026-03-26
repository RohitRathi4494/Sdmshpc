import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE && user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const target_tenant_id = searchParams.get('tenant_id');

        // Tenant Isolation Logic
        let effective_tenant_id: number | null = user.tenant_id;
        let is_global_search = false;

        if (user.role === UserRole.SUPER_ADMIN) {
            if (target_tenant_id) {
                effective_tenant_id = parseInt(target_tenant_id);
                is_global_search = false;
            } else {
                is_global_search = true;
            }
        }

        const tenantClause = is_global_search ? '1=1' : `tenant_id = $1`;
        const values: any[] = is_global_search ? [] : [effective_tenant_id];

        // 1. Get Total Students
        const studentsCountRes = await db.query(`SELECT COUNT(*) FROM students WHERE ${tenantClause}`, values);
        const totalStudents = parseInt(studentsCountRes.rows[0].count);

        // 2. Get Active Classes
        const classesCountRes = await db.query(`SELECT COUNT(*) FROM classes WHERE ${tenantClause}`, values);
        const totalClasses = parseInt(classesCountRes.rows[0].count);

        // 3. Get Total Teachers
        const teachersCountRes = await db.query(`SELECT COUNT(*) FROM users WHERE role = 'TEACHER' AND ${tenantClause}`, values);
        const totalTeachers = parseInt(teachersCountRes.rows[0].count);

        return NextResponse.json({
            success: true,
            data: {
                totalStudents,
                totalClasses,
                totalTeachers
            }
        });

    } catch (error: any) {
        console.error('Stats error:', error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
