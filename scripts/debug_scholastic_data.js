const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function check() {
    try {
        const client = await pool.connect();

        console.log('--- Columns of co_scholastic_scores ---');
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'co_scholastic_scores'
        `);
        console.table(cols.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
