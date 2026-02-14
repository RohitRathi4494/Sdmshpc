
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function debugData() {
    try {
        console.log('--- Debugging Scholastic Report Data ---');

        // 1. Check Classes
        const classesRes = await pool.query('SELECT id, class_name FROM classes LIMIT 5');
        console.log('\nClasses:', classesRes.rows);

        if (classesRes.rows.length === 0) {
            console.log('No classes found. Aborting.');
            return;
        }
        const classId = classesRes.rows[0].id;
        console.log(`\nUsing Class ID: ${classId} (${classesRes.rows[0].class_name})`);

        // 2. Check Assessment Components
        const componentsRes = await pool.query('SELECT id, component_name FROM assessment_components');
        console.log('\nAssessment Components:', componentsRes.rows);

        // 3. Check Subjects for this Class
        const subjectsQuery = `
        SELECT sub.id, sub.subject_name 
        FROM class_subjects cs
        JOIN subjects sub ON cs.subject_id = sub.id
        WHERE cs.class_id = $1
    `;
        const subjectsRes = await pool.query(subjectsQuery, [classId]); // Removed academic_year_id check for broad debugging
        console.log('\nSubjects for Class (ignoring academic year filter):', subjectsRes.rows);

        // 4. Check Scholastic Scores for ANY student in this class
        // First get a student
        const studentRes = await pool.query(`
        SELECT s.id, s.student_name 
        FROM students s 
        JOIN student_enrollments se ON s.id = se.student_id 
        WHERE se.class_id = $1 
        LIMIT 1`, [classId]);

        if (studentRes.rows.length === 0) {
            console.log('No students found in this class.');
        } else {
            const student = studentRes.rows[0];
            console.log(`\nChecking scores for Student: ${student.student_name} (ID: ${student.id})`);

            const scoresRes = await pool.query(`
            SELECT 
                sub.subject_name, 
                t.term_name, 
                ac.component_name, 
                ss.marks,
                ss.academic_year_id
            FROM scholastic_scores ss
            JOIN subjects sub ON ss.subject_id = sub.id
            JOIN terms t ON ss.term_id = t.id
            JOIN assessment_components ac ON ss.component_id = ac.id
            WHERE ss.student_id = $1
        `, [student.id]);

            console.log(`Found ${scoresRes.rows.length} score entries.`);
            if (scoresRes.rows.length > 0) {
                console.log('Sample Scores:', scoresRes.rows.slice(0, 5));
            }
        }

    } catch (err) {
        console.error('Error executing debug script:', err);
    } finally {
        await pool.end();
    }
}

debugData();
