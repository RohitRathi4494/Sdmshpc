import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbInfoRes = await db.query('SELECT current_database(), current_schema()');

        // Let's also list all tables to see what IS there
        const tablesRes = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        return NextResponse.json({
            database: dbInfoRes.rows[0],
            tables: tablesRes.rows.map((r: any) => r.table_name)
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
