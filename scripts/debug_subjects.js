
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSubjects() {
    try {
        console.log('--- Subjects in DB ---');
        const res = await pool.query("SELECT id, subject_name FROM subjects ORDER BY id");
        console.log(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSubjects();
