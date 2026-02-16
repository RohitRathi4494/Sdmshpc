
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

        // Generate Receipt Number: REC-YYYYMMDD-RandomFourDigits
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
        const receiptNumber = `REC-${dateStr}-${randomSuffix}`;
        const userId = parseInt(user.user_id);

        const result = await db.query(
            `INSERT INTO fee_payments 
            (student_id, receipt_number, amount_paid, payment_mode, transaction_reference, remarks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, receipt_number`,
            [student_id, receiptNumber, amount_paid, payment_mode, transaction_reference, remarks, userId]
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
