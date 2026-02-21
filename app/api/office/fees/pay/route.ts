
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { student_id, items, payment_mode, transaction_reference, remarks } = body;

        // items = [{ fee_structure_id: number }, ...]
        if (!student_id || !items || !Array.isArray(items) || items.length === 0 || !payment_mode) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Get active academic year
        const ayRes = await db.query('SELECT id FROM academic_years WHERE is_active = true LIMIT 1');
        const academic_year_id = ayRes.rows[0]?.id || null;

        const batch_id = generateUUID();
        const insertedPayments: any[] = [];
        const skipped: number[] = [];

        for (const item of items) {
            const { fee_structure_id } = item;

            // Get fee amount
            const fsRes = await db.query(
                'SELECT amount FROM fee_structures WHERE id = $1',
                [fee_structure_id]
            );
            if (!fsRes.rows[0]) { skipped.push(fee_structure_id); continue; }

            const amount = Number(fsRes.rows[0].amount);

            // Skip if already paid
            const existingRes = await db.query(
                'SELECT id FROM student_fee_payments WHERE fee_structure_id = $1 AND student_id = $2',
                [fee_structure_id, student_id]
            );
            if (existingRes.rows.length > 0) { skipped.push(fee_structure_id); continue; }

            // Insert payment
            const result = await db.query(`
                INSERT INTO student_fee_payments
                    (student_id, fee_structure_id, amount_paid, payment_mode,
                     transaction_reference, remarks, academic_year_id, batch_id, payment_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
                RETURNING id, amount_paid, payment_date
            `, [
                student_id, fee_structure_id, amount, payment_mode,
                transaction_reference || null, remarks || null,
                academic_year_id, batch_id,
            ]);

            insertedPayments.push(result.rows[0]);
        }

        if (insertedPayments.length === 0) {
            return NextResponse.json({
                success: false,
                message: skipped.length > 0
                    ? 'All selected months are already paid.'
                    : 'No payments to record.',
            }, { status: 400 });
        }

        const total = insertedPayments.reduce((s, p) => s + Number(p.amount_paid), 0);

        return NextResponse.json({
            success: true,
            data: {
                batch_id,
                first_payment_id: insertedPayments[0].id,
                count: insertedPayments.length,
                total_amount: total,
                skipped,
            },
            message: `${insertedPayments.length} payment(s) recorded successfully`,
        });

    } catch (error: any) {
        console.error('Payment Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
