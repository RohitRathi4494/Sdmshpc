const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkIndexes() {
    const client = await pool.connect();
    try {
        console.log('--- Fee Structures Indexes ---');
        const res = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'fee_structures'
        `);
        console.log(res.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkIndexes();
