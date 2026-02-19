import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Add missing grade column
            await client.query(`
                ALTER TABLE co_scholastic_scores 
                ADD COLUMN IF NOT EXISTS grade VARCHAR(10)
            `);

            // Just in case, ensuring other columns exist too
            await client.query(`
                ALTER TABLE co_scholastic_scores 
                ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id)
            `);

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Schema updated: Added "grade" column to co_scholastic_scores.'
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
