
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const studentId = parseInt(params.id);
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        // 1. Student + enrollment
        const studentRes = await db.query(`
            SELECT s.student_name, s.admission_no, s.father_name, s.mother_name,
                   s.id AS student_code, s.stream, s.subject_count,
                   se.class_id, se.section_id, se.academic_year_id, se.roll_no,
                   c.class_name, sec.section_name, ay.year_name
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.id = $1 AND (ay.is_active = true OR ay.id IS NULL)
            ORDER BY ay.is_active DESC NULLS LAST
            LIMIT 1
        `, [studentId]);

        if (!studentRes.rows[0]) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        const student = studentRes.rows[0];
        const { class_id, academic_year_id, stream, subject_count } = student;

        // 2. New-student check: read the explicit is_new_student flag set when the student was added
        let isNewStudent = false;
        const newStudentRes = await db.query(
            'SELECT is_new_student FROM students WHERE id = $1',
            [studentId]
        );
        isNewStudent = newStudentRes.rows[0]?.is_new_student === true;

        // 3. Fetch all fee structures WITH aggregated payment totals for this student
        let feeItems: any[] = [];
        if (class_id && academic_year_id) {
            const res = await db.query(`
                SELECT
                    fs.id AS fee_structure_id,
                    fs.amount,
                    fs.due_date,
                    fh.id AS fee_head_id,
                    fh.head_name,
                    fh.applies_to_new_students_only,
                    COUNT(fs.id) OVER (
                        PARTITION BY fh.id, fs.class_id, fs.academic_year_id
                    ) AS entry_count,
                    COALESCE(p.total_paid, 0) AS total_paid,
                    p.last_payment_date,
                    p.last_payment_mode,
                    p.last_batch_id,
                    p.last_payment_id
                FROM fee_structures fs
                JOIN fee_heads fh ON fs.fee_head_id = fh.id
                LEFT JOIN (
                    SELECT
                        fee_structure_id,
                        SUM(amount_paid) AS total_paid,
                        MAX(id) AS last_payment_id,
                        MAX(payment_date) AS last_payment_date,
                        MAX(payment_mode) AS last_payment_mode,
                        MAX(batch_id) AS last_batch_id
                    FROM student_fee_payments
                    WHERE student_id = $1
                    GROUP BY fee_structure_id
                ) p ON p.fee_structure_id = fs.id
                WHERE fs.class_id = $2
                  AND fs.academic_year_id = $3
                  AND (fs.stream IS NULL OR fs.stream = $4)
                  AND (fs.subject_count IS NULL OR fs.subject_count = $5)
                  AND (
                      fh.applies_to_new_students_only = false OR
                      (fh.applies_to_new_students_only = true AND $6 = true)
                  )
                ORDER BY fh.id, fs.due_date ASC NULLS LAST
            `, [studentId, class_id, academic_year_id, stream || null, subject_count || null, isNewStudent]);

            feeItems = res.rows;
        }

        // 4. Group into monthly vs one-time
        const grouped = new Map<number, any[]>();
        for (const item of feeItems) {
            const key = item.fee_head_id;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)!.push(item);
        }

        const now = new Date();
        const monthlyFees: any[] = [];
        const otherFees: any[] = [];

        for (const [, items] of Array.from(grouped.entries())) {
            const isMonthly = parseInt(items[0].entry_count) > 1;

            if (isMonthly) {
                for (const item of items) {
                    const dueDate = item.due_date ? new Date(item.due_date) : null;
                    const amount = Number(item.amount);
                    const totalPaidForItem = Number(item.total_paid || 0);
                    const balance = Math.max(0, amount - totalPaidForItem);
                    const isPaid = totalPaidForItem >= amount;
                    const isPartial = totalPaidForItem > 0 && !isPaid;
                    const isOverdue = !isPaid && dueDate && dueDate < now;
                    const monthIdx = dueDate ? dueDate.getUTCMonth() : -1;

                    monthlyFees.push({
                        fee_structure_id: item.fee_structure_id,
                        fee_head_id: item.fee_head_id,
                        head_name: item.head_name,
                        amount,
                        total_paid: totalPaidForItem,
                        balance,
                        due_date: item.due_date,
                        month_label: dueDate ? `${MONTHS_FULL[monthIdx]} ${dueDate.getUTCFullYear()}` : 'N/A',
                        month_short: dueDate ? MONTHS_SHORT[monthIdx] : 'N/A',
                        status: isPaid ? 'PAID' : isPartial ? 'PARTIAL' : (isOverdue ? 'OVERDUE' : 'PENDING'),
                        payment_id: item.last_payment_id || null,
                        payment_date: item.last_payment_date || null,
                        payment_mode: item.last_payment_mode || null,
                        batch_id: item.last_batch_id || null,
                    });
                }
            } else {
                const item = items[0];
                const amount = Number(item.amount);
                const totalPaidForItem = Number(item.total_paid || 0);
                const balance = Math.max(0, amount - totalPaidForItem);
                const isPaid = totalPaidForItem >= amount;
                const isPartial = totalPaidForItem > 0 && !isPaid;
                otherFees.push({
                    fee_structure_id: item.fee_structure_id,
                    fee_head_id: item.fee_head_id,
                    head_name: item.head_name,
                    amount,
                    total_paid: totalPaidForItem,
                    balance,
                    due_date: item.due_date,
                    status: isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING',
                    payment_id: item.last_payment_id || null,
                    payment_date: item.last_payment_date || null,
                    payment_mode: item.last_payment_mode || null,
                    batch_id: item.last_batch_id || null,
                });
            }
        }

        // 5. Full payment history
        const historyRes = await db.query(`
            SELECT id, amount_paid, payment_date, payment_mode,
                   transaction_reference, remarks, batch_id, fee_structure_id
            FROM student_fee_payments
            WHERE student_id = $1
            ORDER BY payment_date DESC, id DESC
        `, [studentId]);

        const totalPaid = historyRes.rows.reduce((s, p) => s + Number(p.amount_paid), 0);
        const totalDue = [...monthlyFees, ...otherFees]
            .filter(f => f.status !== 'PAID')
            .reduce((s, f) => s + f.balance, 0);

        return NextResponse.json({
            success: true,
            data: {
                student,
                monthlyFees,
                otherFees,
                history: historyRes.rows,
                totalPaid,
                totalDue,
                balance: totalDue,
            },
        });

    } catch (error: any) {
        console.error('Fee Ledger Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
