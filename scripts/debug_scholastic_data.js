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

        console.log('--- Academic Years (Production Check) ---');
        const years = await client.query('SELECT * FROM academic_years ORDER BY id');
        console.table(years.rows);

        // Also check if user has access to this student
        console.log('--- Student 1 ---');
        const s = await client.query('SELECT id, student_name FROM students WHERE id = $1', [1]);
        console.table(s.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
