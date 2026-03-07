const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function testQuery() {
    try {
        const query = `
            SELECT id, report_type, is_published 
            FROM report_publish_settings 
            WHERE academic_year_id = $1
            ORDER BY report_type
        `;
        const { rows } = await pool.query(query, [1]);
        console.log("ROWS FETCHED:", rows.length);
        console.log("DATA:", rows);
    } catch (e) {
        console.error("DB ERROR:", e);
    } finally {
        await pool.end();
    }
}
testQuery();
