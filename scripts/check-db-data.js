
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Simple env parser since dotenv might not be available or redundant
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envConfig.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
    console.error('Could not find DATABASE_URL in .env.local');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function check() {
    try {
        const client = await pool.connect();

        console.log('--- Classes ---');
        const classes = await client.query('SELECT * FROM classes');
        classes.rows.forEach(r => console.log(`${r.id}: ${r.class_name}`));

        console.log('\n--- Sections ---');
        const sections = await client.query('SELECT s.id, s.section_name, c.class_name FROM sections s JOIN classes c ON s.class_id = c.id');
        sections.rows.forEach(r => console.log(`${r.id}: ${r.section_name} (Class: ${r.class_name})`));

        console.log('\n--- Students (Sample) ---');
        const students = await client.query('SELECT admission_no, student_name, dob FROM students ORDER BY id DESC LIMIT 5');
        students.rows.forEach(r => console.log(`${r.admission_no}: ${r.student_name} (${r.dob})`));

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
