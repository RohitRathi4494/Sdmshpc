import { NextResponse } from 'next/server';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth';
import { db } from '@/app/lib/db';

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.TEACHER)) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Only Admins and Teachers can send notices' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, content, recipients } = body; // recipients: [{ type: 'CLASS'|'STUDENT', id: number }]

        if (!title || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Title, content and at least one recipient are required' },
                { status: 400 }
            );
        }

        // Transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Notice
            const noticeRes = await client.query(
                'INSERT INTO notices (title, content, sender_id) VALUES ($1, $2, $3) RETURNING id',
                [title, content, user.user_id]
            );
            const noticeId = noticeRes.rows[0].id;

            // 2. Insert Recipients
            for (const recipient of recipients) {
                if (!['CLASS', 'STUDENT'].includes(recipient.type)) {
                    throw new Error(`Invalid recipient type: ${recipient.type}`);
                }
                await client.query(
                    'INSERT INTO notice_recipients (notice_id, recipient_type, recipient_id) VALUES ($1, $2, $3)',
                    [noticeId, recipient.type, recipient.recipient_id] // expecting recipient_id in payload
                );
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Notice sent successfully',
                data: { noticeId }
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
