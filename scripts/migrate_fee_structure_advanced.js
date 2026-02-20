const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Advanced Fee Structures...');
        await client.query('BEGIN');

        // 1. Add columns if they don't exist
        await client.query(`
            ALTER TABLE fee_structures 
            ADD COLUMN IF NOT EXISTS stream VARCHAR(50),
            ADD COLUMN IF NOT EXISTS subject_count INTEGER;
        `);
        console.log('Added stream and subject_count columns to fee_structures.');

        // 2. Drop old unique constraint
        // We need to find the name of the constraint first, or just try to drop the likely default name
        // Usually it's fee_structures_academic_year_id_class_id_fee_head_id_key

        try {
            await client.query(`
                ALTER TABLE fee_structures 
                DROP CONSTRAINT IF EXISTS fee_structures_academic_year_id_class_id_fee_head_id_key;
            `);
            console.log('Dropped old unique constraint.');
        } catch (e) {
            console.log('Constraint drop failed or not found, continuing...', e.message);
        }

        // 3. Add new unique constraint
        // We treat NULLs as distinct in SQL usually, but for a unique constraint acting as a logic selector, 
        // passing specific values is better. However, Postgres UNIQUE allows multiple NULLs.
        // To enforce uniqueness including NULLs (treating NULL as a value "All"), we can use a unique index with COALESCE 
        // OR just rely on the application to not create duplicates.
        // For simplicity and strictness: We can perform a conditional unique index.
        // A better approach for "configuration" tables:

        // UNIQUE (academic_year, class, fee_head, COALESCE(stream, ''), COALESCE(subject_count, 0))
        // This requires a function based index or just ensuring we don't insert duplicates.
        // Let's try a standard Unique Index which allows multiple NULLs (technically allowing duplicates of "General" fees if not careful),
        // BUT for our logic, we want only ONE "General" fee per head.

        // Strategy: Use a partial unique index? No, too complex.
        // Let's just add a Unique constraint. If Postgres allows multiple (year, class, head, NULL, NULL), that's technically bad for us.
        // Solution: Create a unique index using COALESCE to force single entry for NULLs.

        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS fee_structures_unique_config 
            ON fee_structures (
                academic_year_id, 
                class_id, 
                fee_head_id, 
                COALESCE(stream, 'ALL'), 
                COALESCE(subject_count, 0)
            );
        `);
        console.log('Added new unique index with COALESCE handling.');

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
