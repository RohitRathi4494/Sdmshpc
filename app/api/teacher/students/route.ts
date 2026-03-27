import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const class_id = searchParams.get('class_id');
        const section_id = searchParams.get('section_id'); // Optional? Contract implies both.
        const academic_year_id = searchParams.get('academic_year_id');

        if (!class_id || !academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing class_id or academic_year_id' },
                { status: 400 }
            );
        }

        const subject_id = searchParams.get('subject_id');

        // First, check if this class is XI or XII
        const classQuery = await db.query('SELECT class_name FROM classes WHERE id = $1 AND tenant_id = $2', [class_id, user.tenant_id]);
        const className = classQuery.rows[0]?.class_name || '';
        const isXiOrXii = className.includes('XI') || className.includes('11') || className.includes('XII') || className.includes('12');

        // Join students and enrollments
        let query = `
      SELECT s.id, s.admission_no, s.student_name, s.father_name, se.roll_no
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id
      `;

        // If it's Class XI/XII and a subject is selected, MUST join student_subjects
        if (isXiOrXii && subject_id) {
            query += ` JOIN student_subjects ss ON ss.student_id = s.id AND ss.academic_year_id = se.academic_year_id AND ss.subject_id = $4 AND ss.tenant_id = $5 `;
        }

        query += ` WHERE se.class_id = $1 AND se.academic_year_id = $2 AND se.tenant_id = $5 AND (s.status IS NULL OR s.status = 'ACTIVE') `;
        const params: any[] = [class_id, academic_year_id];

        if (section_id) {
            query += ` AND se.section_id = $3`;
            params.push(section_id);
        } else {
            // Push a placeholder so index $4 is still available if subject_id is used
            params.push(null);
        }

        if (isXiOrXii && subject_id) {
            params.push(subject_id);
        }
        
        // Add tenant_id as $5
        params.push(user.tenant_id);

        // Fix null comparison if section_id wasn't provided but subject_id was
        query = query.replace('AND se.section_id = $3', section_id ? 'AND se.section_id = $3' : '');

        query += ` ORDER BY se.roll_no ASC, s.student_name ASC`;

        const { rows } = await db.query(query, params);

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
