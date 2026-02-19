const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('--- Remark Types ---');
        const types = await client.query('SELECT * FROM remark_types ORDER BY id');
        console.table(types.rows);

        console.log('--- Recent Remarks ---');
        const remarks = await client.query(`
            SELECT r.id, r.student_id, r.remark_text, rt.type_name 
            FROM remarks r 
            JOIN remark_types rt ON r.remark_type_id = rt.id 
            LIMIT 10
        `);
        console.table(remarks.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

main();
