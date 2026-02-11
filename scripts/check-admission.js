
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envConfig.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
    console.error('Could not find DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function checkAdmissionNo() {
    try {
        const client = await pool.connect();

        console.log('--- Checking for null admission_no ---');
        const res = await client.query('SELECT id, student_name, admission_no FROM students WHERE admission_no IS NULL');

        if (res.rows.length > 0) {
            console.log('Found students with null admission_no:', res.rows);
        } else {
            console.log('No students with null admission_no found.');
        }

        // Also check if any are just empty string
        const empty = await client.query("SELECT id, student_name FROM students WHERE admission_no = ''");
        if (empty.rows.length > 0) {
            console.log("Found students with empty admission_no:", empty.rows);
        }


        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkAdmissionNo();
