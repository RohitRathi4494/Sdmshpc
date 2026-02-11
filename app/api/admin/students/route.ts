import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id');
        const status = searchParams.get('status'); // 'enrolled' | 'unenrolled' | 'all'
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id');

        let query = '';
        const values: any[] = [];

        if (status === 'unenrolled' && academic_year_id) {
            // Find students NOT in student_enrollments for this year
            query = `
                SELECT s.* 
                FROM students s
                WHERE NOT EXISTS (
                    SELECT 1 FROM student_enrollments se 
                    WHERE se.student_id = s.id AND se.academic_year_id = $1
                )
                ORDER BY s.student_name ASC
            `;
            values.push(parseInt(academic_year_id));
        } else if (class_id && academic_year_id) {
            // Find students in specific class/year
            let sectionClause = '';
            if (section_id) {
                sectionClause = `AND se.section_id = $3`;
            }

            query = `
                SELECT s.*, se.roll_no, se.section_id
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id
                WHERE se.class_id = $1 AND se.academic_year_id = $2 ${sectionClause}
                ORDER BY se.roll_no ASC, s.student_name ASC
            `;
            values.push(parseInt(class_id), parseInt(academic_year_id));
            if (section_id) values.push(parseInt(section_id));
        } else {
            // Default: List all students (maybe limit?)
            query = 'SELECT * FROM students ORDER BY id DESC LIMIT 100';
        }

        const { rows } = await db.query(query, values);

        return NextResponse.json({
            success: true,
            data: rows,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
