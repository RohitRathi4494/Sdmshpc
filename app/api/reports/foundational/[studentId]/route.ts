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
        const internalToken = process.env.PDF_INTERNAL_TOKEN || 'default_secret';
        let user;

        if (token === internalToken) {
            user = { role: UserRole.ADMIN }; // Internal pass for PDF generator
        } else {
            user = await verifyAuth(token);
        }

        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id') || '1';
        const studentId = parseInt(params.studentId);

        // Student details
        const studentRes = await db.query(`
            SELECT
                s.id, s.student_name, s.admission_no,
                s.dob AS date_of_birth, s.address, s.phone_no AS phone,
                s.mother_name, s.father_name,
                se.roll_no,
                c.class_name, sec.section_name
            FROM students s
            LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.academic_year_id = $2
            LEFT JOIN classes c ON c.id = se.class_id
            LEFT JOIN sections sec ON sec.id = se.section_id
            WHERE s.id = $1
        `, [studentId, academic_year_id]);
        const student = studentRes.rows[0];
        if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

        const attendanceRes = await db.query(`
            SELECT
                CASE month_id 
                    WHEN 1 THEN 'Apr' WHEN 2 THEN 'May' WHEN 3 THEN 'Jun'
                    WHEN 4 THEN 'Jul' WHEN 5 THEN 'Aug' WHEN 6 THEN 'Sep'
                    WHEN 7 THEN 'Oct' WHEN 8 THEN 'Nov' WHEN 9 THEN 'Dec'
                    WHEN 10 THEN 'Jan' WHEN 11 THEN 'Feb' WHEN 12 THEN 'Mar'
                END AS month,
                working_days AS total,
                days_present AS present
            FROM attendance_records
            WHERE student_id = $1 AND academic_year_id = $2
        `, [studentId, academic_year_id]).catch(() => ({ rows: [] }));

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
