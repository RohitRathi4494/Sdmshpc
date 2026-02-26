import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// GET: fetch all ratings for a student
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
            SELECT term, domain, skill_key, rating
            FROM foundational_skill_ratings
            WHERE student_id = $1 AND academic_year_id = $2
        `, [student_id, academic_year_id]);

        return NextResponse.json({ success: true, data: rows });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// POST: upsert a single rating
export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);
        if (!user || (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { student_id, academic_year_id, term, domain, skill_key, rating } = await request.json();

        if (!student_id || !academic_year_id || !term || !domain || !skill_key) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        if (rating && !['A', 'B', 'C'].includes(rating)) {
            return NextResponse.json({ success: false, message: 'rating must be A, B, or C' }, { status: 400 });
        }

        const { rows } = await db.query(`
            INSERT INTO foundational_skill_ratings (student_id, academic_year_id, term, domain, skill_key, rating, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (student_id, academic_year_id, term, domain, skill_key)
            DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
            RETURNING id, rating
        `, [student_id, academic_year_id, term, domain, skill_key, rating || null]);

        return NextResponse.json({ success: true, data: rows[0] });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
