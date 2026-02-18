import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                ALTER TABLE students
                ADD COLUMN IF NOT EXISTS admission_date DATE,
                ADD COLUMN IF NOT EXISTS student_code VARCHAR(50),
                ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
                ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
                ADD COLUMN IF NOT EXISTS address TEXT,
                ADD COLUMN IF NOT EXISTS phone_no VARCHAR(20),
                ADD COLUMN IF NOT EXISTS emergency_no VARCHAR(20),
                ADD COLUMN IF NOT EXISTS category VARCHAR(20),
                ADD COLUMN IF NOT EXISTS ppp_id VARCHAR(50),
                ADD COLUMN IF NOT EXISTS apaar_id VARCHAR(50),
                ADD COLUMN IF NOT EXISTS aadhar_no VARCHAR(20),
                ADD COLUMN IF NOT EXISTS board_roll_x VARCHAR(50),
                ADD COLUMN IF NOT EXISTS board_roll_xii VARCHAR(50),
                ADD COLUMN IF NOT EXISTS education_reg_no VARCHAR(50),
                ADD COLUMN IF NOT EXISTS srn_no VARCHAR(50),
                ADD COLUMN IF NOT EXISTS stream VARCHAR(50),
                ADD COLUMN IF NOT EXISTS subject_count INTEGER DEFAULT 5;
            `;

            await client.query(query);
            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'FIX APPLIED: Added admission_date and other columns via fix-admission-date-schema route.'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
