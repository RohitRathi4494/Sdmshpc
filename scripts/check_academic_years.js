const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('--- Academic Years ---');
        const res = await client.query('SELECT * FROM academic_years LIMIT 1');
        console.log(res.rows[0]);

        console.log('\n--- Columns ---');
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'academic_years'
        `);
        console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
