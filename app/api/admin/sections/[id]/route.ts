import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

// PUT: Update section (Assign Teacher / Rename)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const sectionId = parseInt(params.id);
        const body = await request.json();
        const { section_name, class_teacher_id } = body;

        // Dynamic update
        let query = 'UPDATE sections SET ';
        const values = [];
        let valueIndex = 1;

        if (section_name) {
            query += `section_name = $${valueIndex}, `;
            values.push(section_name);
            valueIndex++;
        }

        if (class_teacher_id !== undefined) {
            // Can be null
            query += `class_teacher_id = $${valueIndex}, `;
            values.push(class_teacher_id);
            valueIndex++;
        }

        // Remove trailing comma and space
        if (values.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NO_CHANGES', message: 'No changes provided' },
                { status: 400 }
            );
        }

        query = query.slice(0, -2);
        query += ` WHERE id = $${valueIndex} RETURNING id, section_name, class_teacher_id`;
        values.push(sectionId);

        const { rows } = await db.query(query, values);

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Section not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: rows[0],
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE: Remove section (?) - Optional, but good to have
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { success: false, error_code: 'FORBIDDEN', message: 'Access denied' },
                { status: 403 }
            );
        }

        const sectionId = parseInt(params.id);

        // Check for dependencies (students, class_subjects?)
        // Assuming strict constraints, DB will throw error if dependencies exist.

        await db.query('DELETE FROM sections WHERE id = $1', [sectionId]);

        return NextResponse.json({
            success: true,
            message: 'Section deleted'
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'DB_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
