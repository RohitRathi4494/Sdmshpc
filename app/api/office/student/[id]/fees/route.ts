
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

        // 1. Get Student Enrollment, Stream, and Subject Count
        const studentRes = await db.query(`
            SELECT s.student_name, s.admission_no, s.stream, s.subject_count,
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
        const { class_id, academic_year_id, stream, subject_count } = studentData;

        // 2. Fetch Fee Structures (Demands) with Specificity Logic & New Admission Check
        let feeStructures: any[] = [];
        if (class_id && academic_year_id) {
            // Need to know if student is "New Admission" for this academic year
            // Logic: If student.admission_date >= academic_year.start_date

            // Re-fetch with start_date if not present in previous query (it wasn't)
            // But actually we can just JOIN and get it.
            // Let's optimize: Update the first query or just do it here. 
            // The first query had `ay.year_name`. Let's assume we need to re-fetch or update query 1.
            // Actually, let's just fetch the start_date for the `academic_year_id` we have.

            const ayRes = await db.query('SELECT start_date FROM academic_years WHERE id = $1', [academic_year_id]);
            const ayStartDate = ayRes.rows[0]?.start_date;

            // Get student admission date
            const studentAdmRes = await db.query('SELECT admission_date FROM students WHERE id = $1', [studentId]);
            const admissionDate = studentAdmRes.rows[0]?.admission_date;

            let isNewStudent = false;
            if (ayStartDate && admissionDate) {
                // If admission date is ON or AFTER the start of the academic year
                isNewStudent = new Date(admissionDate) >= new Date(ayStartDate);
            }

            const structRes = await db.query(`
                SELECT DISTINCT ON (fs.fee_head_id) 
                    fs.id, fs.amount, fs.due_date, fs.stream, fs.subject_count,
                    fh.head_name, fh.applies_to_new_students_only
                FROM fee_structures fs
                JOIN fee_heads fh ON fs.fee_head_id = fh.id
                WHERE fs.class_id = $1 
                  AND fs.academic_year_id = $2
                  AND (fs.stream IS NULL OR fs.stream = $3)
                  AND (fs.subject_count IS NULL OR fs.subject_count = $4)
                  AND (
                      fh.applies_to_new_students_only = false OR 
                      (fh.applies_to_new_students_only = true AND $5 = true)
                  )
                ORDER BY fs.fee_head_id, 
                         (CASE WHEN fs.stream IS NOT NULL THEN 1 ELSE 0 END + 
                          CASE WHEN fs.subject_count IS NOT NULL THEN 1 ELSE 0 END) DESC
            `, [class_id, academic_year_id, stream || null, subject_count || null, isNewStudent]);

            feeStructures = structRes.rows;
        }

        // 3. Fetch Payments
        const paymentsRes = await db.query(`
            SELECT * FROM student_fee_payments 
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
