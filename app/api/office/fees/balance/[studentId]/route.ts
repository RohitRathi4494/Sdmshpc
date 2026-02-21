import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export async function GET(request: Request, { params }: { params: { studentId: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization')) ||
            new URL(request.url).searchParams.get('token') || '';
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const studentId = parseInt(params.studentId);

        // Student + enrollment
        const studentRes = await db.query(`
            SELECT s.student_name, s.admission_no, s.father_name, s.is_new_student,
                   s.stream, s.subject_count,
                   se.class_id, se.academic_year_id,
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
        const { class_id, academic_year_id, stream, subject_count, is_new_student } = student;

        // Fee structures with aggregated payments
        let feeDetails: any[] = [];
        if (class_id && academic_year_id) {
            const res = await db.query(`
                SELECT
                    fs.id AS fee_structure_id,
                    fs.amount,
                    fs.due_date,
                    fh.head_name,
                    COALESCE(p.total_paid, 0) AS total_paid
                FROM fee_structures fs
                JOIN fee_heads fh ON fs.fee_head_id = fh.id
                LEFT JOIN (
                    SELECT fee_structure_id, SUM(amount_paid) AS total_paid
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
                ORDER BY fh.head_name, fs.due_date ASC NULLS LAST
            `, [studentId, class_id, academic_year_id, stream || null, subject_count || null, is_new_student === true]);

            feeDetails = res.rows.map(r => {
                const amount = Number(r.amount);
                const totalPaid = Number(r.total_paid);
                const balance = Math.max(0, amount - totalPaid);
                const dueDate = r.due_date ? new Date(r.due_date) : null;
                const monthLabel = dueDate
                    ? `${MONTHS_FULL[dueDate.getUTCMonth()]} ${dueDate.getUTCFullYear()}`
                    : null;
                return {
                    head_name: r.head_name,
                    month_label: monthLabel,
                    due_date: r.due_date,
                    amount,
                    total_paid: totalPaid,
                    balance,
                    status: totalPaid >= amount ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING',
                };
            });
        }

        // Payment history
        const historyRes = await db.query(`
            SELECT sfp.id, sfp.amount_paid, sfp.payment_date, sfp.payment_mode,
                   sfp.transaction_reference, sfp.batch_id,
                   fh.head_name, fs.due_date
            FROM student_fee_payments sfp
            LEFT JOIN fee_structures fs ON sfp.fee_structure_id = fs.id
            LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
            WHERE sfp.student_id = $1
            ORDER BY sfp.payment_date ASC, sfp.id ASC
        `, [studentId]);

        const totalDemand = feeDetails.reduce((s, f) => s + f.amount, 0);
        const totalPaid = feeDetails.reduce((s, f) => s + f.total_paid, 0);
        const totalBalance = feeDetails.reduce((s, f) => s + f.balance, 0);

        return NextResponse.json({
            success: true,
            data: {
                student: {
                    student_name: student.student_name,
                    admission_no: student.admission_no,
                    father_name: student.father_name,
                    class_name: student.class_name,
                    section_name: student.section_name,
                    year_name: student.year_name,
                    stream: student.stream,
                },
                feeDetails,
                history: historyRes.rows,
                summary: { totalDemand, totalPaid, totalBalance },
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
