import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

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

        if (!academic_year_id) {
            return NextResponse.json({ success: false, message: 'Academic year ID required' }, { status: 400 });
        }

        const query = `
            SELECT id, report_type, is_published, published_classes 
            FROM report_publish_settings 
            WHERE academic_year_id = $1
            ORDER BY report_type
        `;
        const { rows } = await db.query(query, [parseInt(academic_year_id)]);

        return NextResponse.json({ success: true, data: rows });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
        const { academic_year_id, report_type, is_published, published_classes = [] } = body;

        if (!academic_year_id || !report_type) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Upsert setting
        const query = `
            INSERT INTO report_publish_settings (academic_year_id, report_type, is_published, published_classes)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (academic_year_id, report_type) 
            DO UPDATE SET is_published = EXCLUDED.is_published, published_classes = EXCLUDED.published_classes
            RETURNING id, report_type, is_published, published_classes
        `;
        const { rows } = await db.query(query, [
            parseInt(academic_year_id),
            report_type,
            is_published === true,
            published_classes
        ]);

        return NextResponse.json({ success: true, data: rows[0] });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
