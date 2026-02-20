const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function debug() {
    const client = await pool.connect();
    try {
        console.log('--- Debugging Fee Collection Data ---');

        // 1. Check Academic Years
        const yearsRes = await client.query('SELECT * FROM academic_years ORDER BY id');
        console.log('Academic Years:', yearsRes.rows);

        const activeYear = yearsRes.rows.find(y => y.is_active);
        if (!activeYear) {
            console.log('❌ NO ACTIVE ACADEMIC YEAR FOUND!');
        } else {
            console.log('✅ Active Year:', activeYear.year_name, '(ID:', activeYear.id, ')');

            // 2. Check Enrollments for Active Year
            const enrollmentCount = await client.query(
                'SELECT COUNT(*) FROM student_enrollments WHERE academic_year_id = $1',
                [activeYear.id]
            );
            console.log('Enrollments in Active Year:', enrollmentCount.rows[0].count);

            // 3. Check some sample students
            const sampleStudents = await client.query(`
                SELECT s.student_name, s.admission_no, se.class_id, c.class_name
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id
                LEFT JOIN classes c ON se.class_id = c.id
                WHERE se.academic_year_id = $1
                LIMIT 5
            `, [activeYear.id]);
            console.log('Sample Students in Active Year:', sampleStudents.rows);
        }

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

debug();
