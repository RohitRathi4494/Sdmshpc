import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await db.pool.connect();
        try {
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'co_scholastic_scores'
            `);
            return NextResponse.json({
                success: true,
                columns: result.rows
            });
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
