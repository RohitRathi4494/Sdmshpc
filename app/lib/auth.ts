import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

export enum UserRole {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    VIEW_ONLY = 'VIEW_ONLY',
}

export interface AuthUser {
    user_id: string; // From JWT
    role: UserRole;
}

export async function verifyAuth(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Validate payload has required fields
        if (!payload.user_id || !payload.role) {
            return null;
        }

        // Validate role is known
        const role = payload.role as string;
        if (!Object.values(UserRole).includes(role as UserRole)) {
            return null;
        }

        return {
            user_id: payload.user_id as string,
            role: role as UserRole,
        };
    } catch (error) {
        return null;
    }
}

export function extractToken(authHeader: string | null): string | undefined {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return undefined;
    }
    return authHeader.split(' ')[1];
}
