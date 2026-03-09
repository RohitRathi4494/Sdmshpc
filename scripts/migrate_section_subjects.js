const { Pool } = require('pg');

const PROD_URL = 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString: PROD_URL });

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add section_id column to class_subjects (nullable — NULL = class-wide)
        await client.query(`
            ALTER TABLE class_subjects 
            ADD COLUMN IF NOT EXISTS section_id INT REFERENCES sections(id) ON DELETE CASCADE
        `);
        console.log('✅ Added section_id column to class_subjects');

        // 2. Drop old unique constraint if exists, add new one including section_id
        await client.query(`
            ALTER TABLE class_subjects
            DROP CONSTRAINT IF EXISTS uq_class_subject
        `);
        await client.query(`
            ALTER TABLE class_subjects
            DROP CONSTRAINT IF EXISTS class_subjects_class_id_academic_year_id_subject_id_key
        `);
        // New unique constraint: class + year + section (nullable) + subject
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_class_section_subject
            ON class_subjects (class_id, academic_year_id, subject_id, COALESCE(section_id, -1))
        `);
        console.log('✅ Updated unique constraint on class_subjects');

        await client.query('COMMIT');
        console.log('✅ Migration complete!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
