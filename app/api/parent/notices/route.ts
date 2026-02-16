import { NextResponse } from 'next/server';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.PARENT) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Only Parents can access this endpoint' },
                { status: 403 }
            );
        }

        // 1. Get Parent's Child Details (Class and Student ID)
        // We can reuse logic from /api/parent/student or query directly
        // user.user_id is the student_id for PARENT role as per current auth implementation
        const studentId = user.user_id;

        const studentQuery = `
            SELECT s.id, s.class_id 
            FROM students s 
            WHERE s.id = $1
        `;
        const studentRes = await db.query(studentQuery, [studentId]);

        if (studentRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Student not found' },
                { status: 404 }
            );
        }

        const { id: dbStudentId, class_id } = studentRes.rows[0];

        // 2. Fetch Notices
        // Targeted at STUDENT directly OR targeted at CLASS
        const noticesQuery = `
            SELECT DISTINCT
                n.id,
                n.title,
                n.content,
                n.created_at,
                u.full_name as sender_name
            FROM notices n
            JOIN notice_recipients nr ON n.id = nr.notice_id
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE 
                (nr.recipient_type = 'STUDENT' AND nr.recipient_id = $1)
                OR 
                (nr.recipient_type = 'CLASS' AND nr.recipient_id = $2)
            ORDER BY n.created_at DESC
        `;

        const noticesRes = await db.query(noticesQuery, [dbStudentId, class_id]);

        return NextResponse.json({
            success: true,
            data: noticesRes.rows
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
