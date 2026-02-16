import { NextResponse } from 'next/server';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TEACHER)) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Only Admins and Teachers function' },
                { status: 403 }
            );
        }

        const query = `
            SELECT 
                n.id, 
                n.title, 
                n.content, 
                n.created_at,
                COUNT(nr.id) as recipient_count
            FROM notices n
            LEFT JOIN notice_recipients nr ON n.id = nr.notice_id
            WHERE n.sender_id = $1
            GROUP BY n.id
            ORDER BY n.created_at DESC
        `;

        const result = await db.query(query, [user.user_id]);

        return NextResponse.json({
            success: true,
            data: result.rows
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
