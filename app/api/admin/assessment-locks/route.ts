export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied. Only admins can view assessment locks.' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const academicYearId = searchParams.get('academic_year_id');

        // Note: component_id could map to assessment_components (scholastic) or sub_skills (co-scholastic)
        let query = `
            SELECT 
                al.id,
                al.academic_year_id,
                al.class_id,
                c.class_name,
                al.term_id,
                t.term_name,
                al.component_id,
                al.is_locked,
                al.locked_by,
                u.name as locked_by_name,
                al.locked_at
            FROM assessment_locks al
            JOIN classes c ON al.class_id = c.id
            JOIN terms t ON al.term_id = t.id
            LEFT JOIN users u ON al.locked_by = u.id
        `;
        const params: any[] = [];

        if (academicYearId) {
            query += ` WHERE al.academic_year_id = $1`;
            params.push(parseInt(academicYearId));
        }

        query += ` ORDER BY c.display_order ASC, t.id ASC, al.component_id ASC`;

        const { rows } = await db.query(query, params);

        return NextResponse.json({
            success: true,
            data: rows
        });

    } catch (error: any) {
        console.error("GET /api/admin/assessment-locks error:", error);
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
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied. Only admins can manage assessment locks.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { academic_year_id, class_id, term_id, component_id, is_locked } = body;

        if (!academic_year_id || !class_id || !term_id || !component_id || typeof is_locked !== 'boolean') {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Begin transaction
        await db.query('BEGIN');

        // Upsert logic for assessment_locks
        const upsertQuery = `
            INSERT INTO assessment_locks (academic_year_id, class_id, term_id, component_id, is_locked, locked_by, locked_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (academic_year_id, class_id, term_id, component_id)
            DO UPDATE SET 
                is_locked = EXCLUDED.is_locked,
                locked_by = EXCLUDED.locked_by,
                locked_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const { rows } = await db.query(upsertQuery, [
            academic_year_id, class_id, term_id, component_id, is_locked, parseInt(user.user_id)
        ]);

        const action = is_locked ? 'LOCK' : 'UNLOCK';

        // Audit logging
        const auditQuery = `
            INSERT INTO assessment_locks_audit (admin_id, action, academic_year_id, class_id, term_id, component_id)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await db.query(auditQuery, [
            parseInt(user.user_id), action, academic_year_id, class_id, term_id, component_id
        ]);

        await db.query('COMMIT');

        return NextResponse.json({
            success: true,
            message: `Assessment ${is_locked ? 'locked' : 'unlocked'} successfully`,
            data: rows[0]
        });

    } catch (error: any) {
        await db.query('ROLLBACK');
        console.error("POST /api/admin/assessment-locks error:", error);
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
