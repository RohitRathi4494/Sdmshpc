import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { SignJWT } from 'jose';
import { UserRole } from '@/app/lib/auth';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-me');

export async function POST(request: Request) {
    try {
        const { admission_no, dob } = await request.json();

        if (!admission_no || !dob) {
            return NextResponse.json(
                { success: false, message: 'Admission Number and DOB are required' },
                { status: 400 }
            );
        }

        // 1. Find student by admission_no
        // Fetch DOB as stringDDMMYYYY to avoid timezone issues with Date objects
        const result = await db.query(
            `SELECT id, student_name, TO_CHAR(dob, 'DDMMYYYY') as dob_str FROM students WHERE admission_no = $1`,
            [admission_no]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const student = result.rows[0];

        // 2. Validate DOB
        // Direct string comparison
        if (student.dob_str !== dob) {
            return NextResponse.json(
                { success: false, message: 'Invalid DOB' }, // More specific for debugging, or keep generic 'Invalid credentials'
                { status: 401 }
            );
        }

        // 3. Issue JWT
        // For parents, user_id in JWT will be the student_id
        const token = await new SignJWT({
            user_id: student.id.toString(),
            role: UserRole.PARENT
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(SECRET_KEY);

        return NextResponse.json({
            success: true,
            token,
            role: UserRole.PARENT,
            student: {
                id: student.id,
                name: student.student_name,
                admission_no: admission_no
            }
        });

    } catch (error: any) {
        console.error('Parent Login Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
