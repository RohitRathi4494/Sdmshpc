import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { verifyAuth, extractToken } from '@/app/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export async function POST(request: Request) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const userAuth = await verifyAuth(token);

        if (!userAuth) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const result = changePasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = result.data;

        // 1. Fetch user to get current password hash
        const userQuery = 'SELECT id, password_hash FROM users WHERE id = $1';
        const userRes = await db.query(userQuery, [userAuth.user_id]);

        if (userRes.rows.length === 0) {
            return NextResponse.json(
                { success: false, error_code: 'USER_NOT_FOUND', message: 'User not found' },
                { status: 404 }
            );
        }

        const user = userRes.rows[0];

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, error_code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // 3. Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);

        // 4. Update password
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userAuth.user_id]);

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { success: false, error_code: 'SERVER_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
