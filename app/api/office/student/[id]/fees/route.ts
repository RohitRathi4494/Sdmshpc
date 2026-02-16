
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const studentId = parseInt(params.id);
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        // 1. Get Student Enrollment to find Class & Academic Year & User Info
        // Fetch student name too for the UI header
        const studentRes = await db.query(`
            SELECT s.student_name, s.admission_no, 
                   se.class_id, se.academic_year_id,
                   c.class_name, ay.year_name
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.id = $1 AND (ay.is_active = true OR ay.id IS NULL)
            ORDER BY ay.is_active DESC
            LIMIT 1
        `, [studentId]);

        if (studentRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
        }

        const studentData = studentRes.rows[0];
        const { class_id, academic_year_id } = studentData;

        // 2. Fetch Fee Structures (Demands)
        let feeStructures: any[] = [];
        if (class_id && academic_year_id) {
            const structRes = await db.query(`
                SELECT fs.id, fs.amount, fs.due_date, fh.head_name
                FROM fee_structures fs
                JOIN fee_heads fh ON fs.fee_head_id = fh.id
                WHERE fs.class_id = $1 AND fs.academic_year_id = $2
            `, [class_id, academic_year_id]);
            feeStructures = structRes.rows;
        }

        // 3. Fetch Payments
        const paymentsRes = await db.query(`
            SELECT * FROM fee_payments 
            WHERE student_id = $1 
            ORDER BY payment_date DESC
        `, [studentId]);

        // 4. Calculate Totals
        const totalDue = feeStructures.reduce((sum, item) => sum + Number(item.amount), 0);
        const totalPaid = paymentsRes.rows.reduce((sum, item) => sum + Number(item.amount_paid), 0);
        const balance = totalDue - totalPaid;

        return NextResponse.json({
            success: true,
            data: {
                student: studentData,
                totalDue,
                totalPaid,
                balance,
                structure: feeStructures,
                history: paymentsRes.rows
            }
        });

    } catch (error: any) {
        console.error('Fee Ledger Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
