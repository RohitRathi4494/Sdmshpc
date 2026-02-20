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
        console.log('--- Adding start_date and end_date to academic_years ---');

        await client.query(`
            ALTER TABLE academic_years 
            ADD COLUMN IF NOT EXISTS start_date DATE,
            ADD COLUMN IF NOT EXISTS end_date DATE;
        `);

        // Update existing 2025-2026 year
        await client.query(`
            UPDATE academic_years 
            SET start_date = '2025-04-01', end_date = '2026-03-31'
            WHERE year_name = '2025-2026';
        `);

        console.log('Migration successful');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
