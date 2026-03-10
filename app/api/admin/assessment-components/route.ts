export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        // Return scholastic components
        const cmpQuery = `
            SELECT id, component_name as name, component_name as display_name 
            FROM assessment_components 
            ORDER BY id ASC
        `;
        const cmpRows = await db.query(cmpQuery);

        // Also return co-scholastic sub_skills to lock co-scholastic
        const coSchoQuery = `
            SELECT id, sub_skill_name as name 
            FROM sub_skills 
            ORDER BY id ASC
        `;
        const coSchoRows = await db.query(coSchoQuery);

        return NextResponse.json({
            success: true,
            data: {
                scholastic: cmpRows.rows,
                co_scholastic: coSchoRows.rows
            }
        });

    } catch (error: any) {
        console.error("GET /api/admin/assessment-components error:", error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
