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
        console.log('--- Checking Classes Table Schema ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'classes'
        `);
        console.log('Columns in classes table:', res.rows.map(r => r.column_name));

        const hasDisplayOrder = res.rows.some(r => r.column_name === 'display_order');
        console.log('Has display_order?', hasDisplayOrder);

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
