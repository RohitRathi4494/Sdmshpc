
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting Migration: Notices tables...');

        // 1. Create Notices Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sender_id INTEGER REFERENCES users(id)
            );
        `);
        console.log('Created notices table (or already exists).');

        // 2. Create Notice Recipients Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notice_recipients (
                id SERIAL PRIMARY KEY,
                notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
                recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('CLASS', 'STUDENT')),
                recipient_id INTEGER NOT NULL
            );
        `);
        console.log('Created notice_recipients table (or already exists).');

        // 3. Create Index
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_notice_recipients_target ON notice_recipients(recipient_type, recipient_id);
        `);
        console.log('Created index on notice_recipients.');

        return NextResponse.json({
            success: true,
            message: 'Successfully created notices and notice_recipients tables.'
        });

    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
