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
                { success: false, error_code: 'UNAUTHORIZED', message: 'Only Parents can access this endpoint' },
                { status: 403 }
            );
        }

        // 1. Get Parent's Child Details (Class and Student ID)
        // We can reuse logic from /api/parent/student or query directly
        // user.user_id is the student_id for PARENT role as per current auth implementation
        const studentId = parseInt(user.user_id);

        // 1. Get Active Academic Year
        const yearRes = await db.query('SELECT id FROM academic_years WHERE is_active = true LIMIT 1');
        if (yearRes.rows.length === 0) {
            console.error('No active academic year found');
            return NextResponse.json(
                { success: false, error_code: 'CONFIG_ERROR', message: 'No active academic year configured' },
                { status: 500 }
            );
        }
        const activeYearId = yearRes.rows[0].id;

        // 2. Get Student's Class from Enrollment
        const enrollmentQuery = `
            SELECT class_id 
            FROM student_enrollments 
            WHERE student_id = $1 AND academic_year_id = $2
        `;
        const enrollmentRes = await db.query(enrollmentQuery, [studentId, activeYearId]);

        let classId: number | null = null;

        if (enrollmentRes.rows.length > 0) {
            classId = enrollmentRes.rows[0].class_id;
        } else {
            // Fallback to students table if no enrollment (legacy support or new admission)
            const studentRes = await db.query('SELECT class_id FROM students WHERE id = $1', [studentId]);
            if (studentRes.rows.length > 0) {
                classId = studentRes.rows[0].class_id;
            }
        }

        console.log(`Fetching notices for Student: ${studentId}, Class: ${classId}, Year: ${activeYearId}`);

        if (!classId) {
            // If still no class, they can only see student-specific notices
            console.log('No class found for student');
        }

        // 3. Fetch Notices
        const noticesQuery = `
            SELECT DISTINCT
                n.id,
                n.title,
                n.content,
                n.created_at,
                u.full_name as sender_name
            FROM notices n
            JOIN notice_recipients nr ON n.id = nr.notice_id
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE 
                (nr.recipient_type = 'STUDENT' AND nr.recipient_id = $1)
                OR 
                (nr.recipient_type = 'CLASS' AND nr.recipient_id = $2)
            ORDER BY n.created_at DESC
        `;

        const noticesRes = await db.query(noticesQuery, [studentId, classId]); // classId can be null, query handles it if $2 is null (it won't match anything for class)

        return NextResponse.json({
            success: true,
            data: noticesRes.rows
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
