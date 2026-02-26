import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const token = extractToken(request.headers.get('Authorization')) ||
            new URL(request.url).searchParams.get('token') || '';
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id') || '1';
        const studentId = parseInt(params.studentId);

        // Student details
        const studentRes = await db.query(`
            SELECT
                s.id, s.student_name, s.admission_no, s.roll_no,
                s.date_of_birth, s.address, s.phone, s.mother_name, s.father_name,
                c.class_name, sec.section_name
            FROM students s
            LEFT JOIN class_sections cs ON cs.id = s.class_section_id
            LEFT JOIN classes c ON c.id = cs.class_id
            LEFT JOIN sections sec ON sec.id = cs.section_id
            WHERE s.id = $1
        `, [studentId]);
        const student = studentRes.rows[0];
        if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

        // Attendance (month-wise)
        const attendanceRes = await db.query(`
            SELECT
                TO_CHAR(DATE_TRUNC('month', date), 'Mon') AS month,
                TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month_key,
                COUNT(*) FILTER (WHERE status = 'PRESENT') AS present,
                COUNT(*) AS total
            FROM attendance
            WHERE student_id = $1
            GROUP BY month_key, month
            ORDER BY month_key
        `, [studentId]).catch(() => ({ rows: [] }));

        // Skill ratings
        const ratingsRes = await db.query(`
            SELECT term, domain, skill_key, rating
            FROM foundational_skill_ratings
            WHERE student_id = $1 AND academic_year_id = $2
        `, [studentId, academic_year_id]);

        // Text fields
        const textRes = await db.query(`
            SELECT term, field_key, field_value
            FROM foundational_text_fields
            WHERE student_id = $1 AND academic_year_id = $2
        `, [studentId, academic_year_id]);

        return NextResponse.json({
            success: true,
            data: {
                student,
                attendance: attendanceRes.rows,
                ratings: ratingsRes.rows,
                textFields: textRes.rows,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
