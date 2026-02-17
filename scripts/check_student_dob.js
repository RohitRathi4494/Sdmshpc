const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('Connecting with:', connectionString ? 'Connection String Found' : 'No Connection String');
console.log('SSL Mode:', process.env.NODE_ENV === 'production' ? 'Required' : 'Optional/None');

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function check() {
    try {
        const client = await pool.connect();

        // Fetch one student with a DOB
        const res = await client.query(`
      SELECT id, admission_no, student_name, dob, TO_CHAR(dob, 'DDMMYYYY') as dob_str 
      FROM students 
      WHERE dob IS NOT NULL 
      LIMIT 1
    `);

        if (res.rows.length === 0) {
            console.log('No students with DOB found.');
        } else {
            const s = res.rows[0];
            console.log('Student Found:', {
                id: s.id,
                name: s.student_name,
                admission_no: s.admission_no,
                dob_raw: s.dob,
                dob_str_db: s.dob_str
            });

            console.log('--- Test Login Logic ---');
            const inputDob = s.dob_str;
            console.log(`Simulating Input DOB: ${inputDob}`);
            console.log(`Match? ${s.dob_str === inputDob}`);
        }

        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

check();
