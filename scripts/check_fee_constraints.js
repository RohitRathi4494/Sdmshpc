const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkConstraints() {
    const client = await pool.connect();
    try {
        console.log('--- Fee Structures Constraints ---');
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'fee_structures'::regclass
        `);
        console.log(res.rows);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkConstraints();
