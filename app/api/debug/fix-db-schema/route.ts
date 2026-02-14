
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Drop the grade column from scholastic_scores
        await db.query(`
      ALTER TABLE scholastic_scores 
      DROP COLUMN IF EXISTS grade;
    `);

        // 2. Also drop it from co_scholastic_scores if it exists there too (just in case)
        await db.query(`
      ALTER TABLE co_scholastic_scores 
      DROP COLUMN IF EXISTS grade;
    `);

        return NextResponse.json({
            success: true,
            message: 'Successfully removed "grade" column from scholastic_scores and co_scholastic_scores.'
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
