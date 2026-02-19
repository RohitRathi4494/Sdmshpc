import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

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

        // Fetch Domains with SubSkills
        const query = `
            SELECT d.id as domain_id, d.domain_name, 
                   ss.id as skill_id, ss.sub_skill_name
            FROM domains d
            JOIN sub_skills ss ON d.id = ss.domain_id
            ORDER BY d.id, ss.id
        `;

        const { rows } = await db.query(query);

        // Group by Domain
        const domainsMap = new Map();
        rows.forEach(row => {
            if (!domainsMap.has(row.domain_id)) {
                domainsMap.set(row.domain_id, {
                    id: row.domain_id,
                    name: row.domain_name,
                    skills: []
                });
            }
            domainsMap.get(row.domain_id).skills.push({
                id: row.skill_id,
                name: row.sub_skill_name
            });
        });

        const domains = Array.from(domainsMap.values());

        return NextResponse.json({
            success: true,
            data: domains
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
