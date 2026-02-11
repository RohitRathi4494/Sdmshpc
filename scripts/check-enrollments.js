
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

async function checkEnrollments() {
    try {
        const client = await pool.connect();

        console.log('--- Active Academic Year ---');
        const year = await client.query('SELECT * FROM academic_years WHERE is_active = true');
        console.log(year.rows);

        const yearId = year.rows[0]?.id || 1;

        console.log('\n--- Enrollments for Year ' + yearId + ' ---');
        const enrollments = await client.query(`
            SELECT 
                se.id, 
                s.student_name, 
                c.class_name, 
                sec.section_name 
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.id
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            WHERE se.academic_year_id = $1
            LIMIT 10
        `, [yearId]);

        console.log(enrollments.rows);

        console.log('\n--- Total Enrollments ---');
        const count = await client.query('SELECT count(*) FROM student_enrollments WHERE academic_year_id = $1', [yearId]);
        console.log(count.rows[0]);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkEnrollments();
