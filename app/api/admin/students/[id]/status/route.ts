export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.OFFICE)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const studentId = parseInt(params.id);
        if (isNaN(studentId)) {
            return NextResponse.json(
                { success: false, error_code: 'INVALID_REQUEST', message: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status } = body; // 'ACTIVE' or 'WITHDRAWN'

        if (status !== 'ACTIVE' && status !== 'WITHDRAWN') {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid status value' },
                { status: 400 }
            );
        }

        const result = await db.query(
            'UPDATE students SET status = $1 WHERE id = $2 RETURNING id, student_name, status',
            [status, studentId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Student marked as ${status}`,
            data: result.rows[0]
        });

    } catch (error: any) {
        console.error('Update student status error:', error);
        return NextResponse.json(
            { success: false, error_code: 'SERVER_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
