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

        // 1. Get a student
        const studentRes = await client.query('SELECT id FROM students LIMIT 1');
        if (studentRes.rows.length === 0) {
            console.log('No students found');
            return;
        }
        const studentId = studentRes.rows[0].id;
        console.log(`Testing with Student ID: ${studentId}`);

        // 2. Insert a score (SubSkill 1, Term 1, Grade A)
        // Clean up first
        await client.query('DELETE FROM co_scholastic_scores WHERE student_id = $1', [studentId]);

        console.log('Inserting Score...');
        const insertQuery = `
            INSERT INTO co_scholastic_scores (student_id, sub_skill_id, term_id, grade, academic_year_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const inserted = await client.query(insertQuery, [studentId, 1, 1, 'A', 1]);
        console.log('Inserted:', inserted.rows[0]);

        // 3. Select back using report query
        console.log('Fetching Report Data...');
        const coScholasticQuery = `
            SELECT css.*, ss.sub_skill_name, d.domain_name, t.term_name
            FROM co_scholastic_scores css
            JOIN sub_skills ss ON css.sub_skill_id = ss.id
            JOIN domains d ON ss.domain_id = d.id
            JOIN terms t ON css.term_id = t.id
            WHERE css.student_id = $1 AND css.academic_year_id = $2
        `;
        const res = await client.query(coScholasticQuery, [studentId, 1]);
        console.log('Fetched Count:', res.rows.length);
        console.log('Fetched Data:', res.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
