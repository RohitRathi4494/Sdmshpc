
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Handle date parsing safely
        let queryDate: string;
        if (dateParam) {
            queryDate = dateParam;
        } else {
            const now = new Date();
            queryDate = now.toISOString().split('T')[0];
        }

        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        // 1. Get Transactions for the date
        const result = await db.query(`
            SELECT fp.*, s.student_name, s.admission_no, 
                   c.class_name, sec.section_name,
                   u.full_name as collected_by_name
            FROM fee_payments fp
            JOIN students s ON fp.student_id = s.id
            LEFT JOIN student_enrollments se ON s.id = se.student_id 
                 AND se.academic_year_id = (SELECT id FROM academic_years WHERE is_active = true LIMIT 1)
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN users u ON fp.created_by = u.id
            WHERE date(fp.payment_date) = $1
            ORDER BY fp.payment_date DESC
        `, [queryDate]);

        const transactions = result.rows;

        // 2. Calculate Summary by Mode
        const summaryByMode: Record<string, number> = {};
        let totalCollection = 0;

        transactions.forEach(t => {
            const amount = Number(t.amount_paid);
            const mode = t.payment_mode || 'UNKNOWN';
            // Use number or 0
            const current = summaryByMode[mode] || 0;
            summaryByMode[mode] = current + amount;
            totalCollection += amount;
        });

        return NextResponse.json({
            success: true,
            data: {
                date: queryDate,
                totalCollection,
                summaryByMode,
                transactions
            }
        });

    } catch (error: any) {
        console.error('Daily Report Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
