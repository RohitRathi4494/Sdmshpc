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

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { admission_no, student_name, father_name, mother_name, dob, class_id, section_id, academic_year_id } = body;

        if (!admission_no || !student_name || !father_name || !dob) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Student
            const insertStudentQuery = `
                INSERT INTO students (admission_no, student_name, father_name, mother_name, dob)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (admission_no) DO UPDATE 
                SET student_name = EXCLUDED.student_name,
                    father_name = EXCLUDED.father_name,
                    mother_name = EXCLUDED.mother_name,
                    dob = EXCLUDED.dob
                RETURNING id;
            `;
            const studentRes = await client.query(insertStudentQuery, [
                admission_no, student_name, father_name, mother_name, dob
            ]);
            const studentId = studentRes.rows[0].id;

            // 2. Enroll if class/section provided
            if (class_id && section_id && academic_year_id) {
                const checkEnrollment = `
                    SELECT id FROM student_enrollments 
                    WHERE student_id = $1 AND academic_year_id = $2
                `;
                const existing = await client.query(checkEnrollment, [studentId, academic_year_id]);

                if (existing.rows.length > 0) {
                    await client.query(`
                        UPDATE student_enrollments
                        SET class_id = $1, section_id = $2
                        WHERE id = $3
                    `, [class_id, section_id, existing.rows[0].id]);
                } else {
                    await client.query(`
                        INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year_id)
                        VALUES ($1, $2, $3, $4)
                    `, [studentId, class_id, section_id, academic_year_id]);
                }
            }

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Student created/updated successfully',
                data: { id: studentId }
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Create student error:', error);
        return NextResponse.json(
            { success: false, error_code: 'SERVER_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
