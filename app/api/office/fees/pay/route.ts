
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { student_id, amount_paid, payment_mode, transaction_reference, remarks } = body;

        if (!student_id || !amount_paid || !payment_mode) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const result = await db.query(
            `INSERT INTO student_fee_payments 
            (student_id, amount_paid, payment_mode, transaction_reference, remarks)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, amount_paid, payment_date`,
            [student_id, amount_paid, payment_mode, transaction_reference, remarks]
        );

        const payment = result.rows[0];

        return NextResponse.json({
            success: true,
            data: payment,
            message: 'Payment recorded successfully'
        });

    } catch (error: any) {
        console.error('Payment Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
