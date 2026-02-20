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
        console.log('--- Classes ---');
        const classes = await client.query('SELECT id, class_name FROM classes ORDER BY id');
        classes.rows.forEach(c => console.log(`${c.id}: ${c.class_name}`));

        console.log('\n--- Fee Heads ---');
        const heads = await client.query('SELECT * FROM fee_heads');
        console.log(heads.rows);

        console.log('\n--- Fee Structures Columns ---');
        const fsCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'fee_structures'
        `);
        console.log(fsCols.rows.map(r => `${r.column_name} (${r.data_type})`));

        console.log('\n--- Students Columns ---');
        const stCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students'
        `);
        console.log(stCols.rows.map(r => `${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
