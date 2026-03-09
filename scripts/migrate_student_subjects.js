const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    console.log("🚀 Starting Student Subjects Migration...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log("📄 Creating student_subjects table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS student_subjects (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                subject_id INT NOT NULL,
                academic_year_id INT NOT NULL,
                subject_type VARCHAR(20) NOT NULL DEFAULT 'mandatory', -- 'mandatory', 'optional_5th', 'additional_6th'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_stu_sub_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                CONSTRAINT fk_stu_sub_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
                CONSTRAINT uq_student_subject UNIQUE (student_id, subject_id, academic_year_id)
            );
        `);
        console.log("✅ Table created.");

        await client.query('COMMIT');
        console.log("✅ Migration completed successfully!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Migration failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
