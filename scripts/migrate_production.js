const { Pool } = require('pg');

const PROD_URL = 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: PROD_URL });

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Creating student_subjects table on production...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS student_subjects (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                academic_year_id INT NOT NULL,
                subject_type VARCHAR(20) NOT NULL DEFAULT 'mandatory',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_stu_sub_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
                CONSTRAINT uq_student_subject UNIQUE (student_id, subject_id, academic_year_id)
            )
        `);

        await client.query('COMMIT');
        console.log("SUCCESS: student_subjects table is ready on production!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("ERROR:", e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
