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
                { success: false, message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const studentId = parseInt(user.user_id);

        // 1. Get student + active enrollment
        const studentRes = await db.query(`
            SELECT s.student_name, s.admission_no, s.is_new_student,
                   se.class_id, se.academic_year_id,
                   c.class_name, ay.year_name
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.id = $1 AND (ay.is_active = true OR ay.id IS NULL)
            ORDER BY ay.is_active DESC NULLS LAST
            LIMIT 1
        `, [studentId]);

        if (studentRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        const student = studentRes.rows[0];
        const { class_id, academic_year_id } = student;

        // 2. Get pending dues — only where due_date <= TODAY and not yet paid
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let pendingDues: any[] = [];

        if (class_id && academic_year_id) {
            const pendingRes = await db.query(`
                SELECT
                    fs.id AS fee_structure_id,
                    fh.head_name,
                    fs.amount,
                    fs.due_date,
                    sfp.id AS payment_id
                FROM fee_structures fs
                JOIN fee_heads fh ON fs.fee_head_id = fh.id
                LEFT JOIN student_fee_payments sfp
                    ON sfp.fee_structure_id = fs.id AND sfp.student_id = $1
                WHERE fs.class_id = $2
                  AND fs.academic_year_id = $3
                  AND fs.due_date <= $4
                  AND sfp.id IS NULL
                  AND (
                      fh.applies_to_new_students_only = false
                      OR (fh.applies_to_new_students_only = true AND $5 = true)
                  )
                ORDER BY fs.due_date ASC
            `, [studentId, class_id, academic_year_id, today, student.is_new_student === true]);

            // Group monthly fees by month label for cleaner display
            pendingDues = pendingRes.rows.map(row => ({
                fee_structure_id: row.fee_structure_id,
                head_name: row.head_name,
                amount: Number(row.amount),
                due_date: row.due_date,
                month_label: row.due_date
                    ? new Date(row.due_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : null,
            }));
        }

        // 3. Get payment history
        const historyRes = await db.query(`
            SELECT
                sfp.id,
                sfp.amount_paid,
                sfp.payment_date,
                sfp.payment_mode,
                sfp.transaction_reference,
                sfp.batch_id,
                fh.head_name,
                fs.due_date
            FROM student_fee_payments sfp
            LEFT JOIN fee_structures fs ON sfp.fee_structure_id = fs.id
            LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
            WHERE sfp.student_id = $1
            ORDER BY sfp.payment_date DESC, sfp.id DESC
        `, [studentId]);

        // Group payments by batch_id for multi-month receipts
        const batchMap = new Map<string, any>();
        for (const row of historyRes.rows) {
            const key = row.batch_id || `single_${row.id}`;
            if (!batchMap.has(key)) {
                batchMap.set(key, {
                    batch_id: row.batch_id,
                    payment_date: row.payment_date,
                    payment_mode: row.payment_mode,
                    transaction_reference: row.transaction_reference,
                    items: [],
                    total_amount: 0,
                });
            }
            const batch = batchMap.get(key);
            batch.items.push({
                head_name: row.head_name || 'Fee',
                amount: Number(row.amount_paid),
                due_date: row.due_date,
                month_label: row.due_date
                    ? new Date(row.due_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : null,
            });
            batch.total_amount += Number(row.amount_paid);
        }

        const history = Array.from(batchMap.values());

        const totalPaid = history.reduce((sum, b) => sum + b.total_amount, 0);
        const totalDue = pendingDues.reduce((sum, d) => sum + d.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                student: {
                    student_name: student.student_name,
                    admission_no: student.admission_no,
                    class_name: student.class_name,
                    year_name: student.year_name,
                },
                pendingDues,
                history,
                totalPaid,
                totalDue,
            },
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
