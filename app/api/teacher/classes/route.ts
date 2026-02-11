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

        // Teacher has global access to all classes for now
        // Fetch classes and sections
        // Fetch classes and sections
        let query = `
            SELECT c.id as class_id, c.class_name, c.display_order,
                   s.id as section_id, s.section_name
            FROM classes c
            JOIN sections s ON c.id = s.class_id
        `;

        const values = [];

        if (user.role === UserRole.TEACHER) {
            query += ` WHERE s.class_teacher_id = $1`;
            // Ensure user_id is integer
            values.push(parseInt(user.user_id));
        }

        query += ` ORDER BY c.display_order ASC, s.section_name ASC`;

        const { rows } = await db.query(query, values);

        // Group by Class
        const classesMap = new Map();
        rows.forEach(row => {
            if (!classesMap.has(row.class_id)) {
                classesMap.set(row.class_id, {
                    id: row.class_id,
                    class_name: row.class_name,
                    sections: []
                });
            }
            classesMap.get(row.class_id).sections.push({
                id: row.section_id,
                section_name: row.section_name
            });
        });

        return NextResponse.json({
            success: true,
            data: Array.from(classesMap.values()),
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
