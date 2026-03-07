import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.PARENT) {
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
            SELECT report_type 
            FROM report_publish_settings 
            WHERE academic_year_id = $1 AND is_published = TRUE
        `;
        const { rows } = await db.query(query, [parseInt(academic_year_id)]);

        // Return just an array of the published truthy strings
        const publishedTypes = rows.map(r => r.report_type);

        return NextResponse.json({ success: true, data: publishedTypes });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
