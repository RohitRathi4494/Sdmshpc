const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function check() {
    const client = await pool.connect();
    try {
        console.log('--- Academic Years ---');
        const years = await client.query('SELECT * FROM academic_years ORDER BY id');
        console.table(years.rows);

        console.log('\n--- Fee Structures Count by Year ---');
        const counts = await client.query('SELECT academic_year_id, count(*) FROM fee_structures GROUP BY academic_year_id');
        console.table(counts.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
