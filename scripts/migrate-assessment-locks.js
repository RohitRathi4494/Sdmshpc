const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.Production_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Missing DB URL in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

const migrationQuery = `
-- Create assessment_locks table
CREATE TABLE IF NOT EXISTS assessment_locks (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL, -- references assessment_components(id) OR sub_skills(id) depending on scholastic/co-scholastic context
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by INTEGER NOT NULL REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (academic_year_id, class_id, term_id, component_id)
);

-- Create assessment_locks_audit table
CREATE TABLE IF NOT EXISTS assessment_locks_audit (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- 'LOCK' or 'UNLOCK'
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    term_id INTEGER NOT NULL REFERENCES terms(id),
    component_id INTEGER NOT NULL,
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_assessment_locks_lookup 
ON assessment_locks(academic_year_id, class_id, term_id, component_id);

CREATE INDEX IF NOT EXISTS idx_assessment_locks_audit_lookup 
ON assessment_locks_audit(academic_year_id, action_timestamp DESC);
`;

async function runMigration() {
    try {
        await client.connect();
        await client.query(migrationQuery);
        console.log("Migration completed successfully for assessment_locks tables.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigration();
