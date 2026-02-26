import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// GET: fetch all text fields for a student
export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization')) ||
            new URL(request.url).searchParams.get('token') || '';
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const student_id = searchParams.get('student_id');
        const academic_year_id = searchParams.get('academic_year_id');

        if (!student_id || !academic_year_id) {
            return NextResponse.json({ success: false, message: 'student_id and academic_year_id required' }, { status: 400 });
        }

        const { rows } = await db.query(`
            SELECT term, field_key, field_value
            FROM foundational_text_fields
            WHERE student_id = $1 AND academic_year_id = $2
        `, [student_id, academic_year_id]);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// POST: upsert a text field
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { student_id, academic_year_id, term, field_key, field_value } = await request.json();

        if (!student_id || !academic_year_id || !term || !field_key) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await db.query(`
            INSERT INTO foundational_text_fields (student_id, academic_year_id, term, field_key, field_value, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (student_id, academic_year_id, term, field_key)
            DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
        `, [student_id, academic_year_id, term, field_key, field_value ?? '']);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
