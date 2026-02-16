import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const auth = await verifyAuth(token);

        if (!auth || auth.role !== UserRole.PARENT) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const studentId = parseInt(auth.user_id);

        // Fetch Student Details + Active Enrollment
        // We need the class/section for the ACTIVE academic year.

        // 1. Get Active Year first
        const yearRes = await db.query('SELECT id, year_name FROM academic_years WHERE is_active = true LIMIT 1');
        if (yearRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No active academic year found' },
                { status: 500 }
            );
        }
        const activeYear = yearRes.rows[0];

        // 2. Get Student & Enrollment
        const studentRes = await db.query(
            `SELECT 
                s.id, s.student_name, s.admission_no, s.father_name, s.mother_name, s.dob,
                se.roll_no,
                c.class_name,
                sec.section_name
             FROM students s
             LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.academic_year_id = $1
             LEFT JOIN classes c ON se.class_id = c.id
             LEFT JOIN sections sec ON se.section_id = sec.id
             WHERE s.id = $2`,
            [activeYear.id, studentId]
        );

        if (studentRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        const student = studentRes.rows[0];

        return NextResponse.json({
            success: true,
            data: {
                student,
                academicYear: activeYear
            }
        });

    } catch (error: any) {
        console.error('Parent Student Data Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
