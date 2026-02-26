// scripts/migrate-foundational.js
// Run once: node scripts/migrate-foundational.js
// Creates the two new tables for the Foundational Stage HPC module.

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── Table 1: skill ratings (A / B / C) ─────────────────────────────
        await client.query(`
            CREATE TABLE IF NOT EXISTS foundational_skill_ratings (
                id               SERIAL PRIMARY KEY,
                student_id       INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                academic_year_id INT NOT NULL,
                term             VARCHAR(10) NOT NULL CHECK (term IN ('TERM1','TERM2')),
                domain           VARCHAR(80) NOT NULL,
                skill_key        VARCHAR(120) NOT NULL,
                rating           VARCHAR(5) CHECK (rating IN ('A','B','C')),
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (student_id, academic_year_id, term, domain, skill_key)
            );
        `);
        console.log('✓ foundational_skill_ratings table ready');

        // ── Table 2: free-text fields (profiles, self-assessment, etc.) ─────
        await client.query(`
            CREATE TABLE IF NOT EXISTS foundational_text_fields (
                id               SERIAL PRIMARY KEY,
                student_id       INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                academic_year_id INT NOT NULL,
                term             VARCHAR(10) NOT NULL CHECK (term IN ('TERM1','TERM2')),
                field_key        VARCHAR(80) NOT NULL,
                field_value      TEXT,
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (student_id, academic_year_id, term, field_key)
            );
        `);
        console.log('✓ foundational_text_fields table ready');

        await client.query('COMMIT');
        console.log('\nMigration complete ✅');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
