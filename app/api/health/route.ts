import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        await db.query('SELECT 1');
        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            latency: `${duration}ms`,
            env: process.env.NODE_ENV,
            // Do not expose full connection string, just check if it exists
            has_db_url: !!process.env.DATABASE_URL
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
