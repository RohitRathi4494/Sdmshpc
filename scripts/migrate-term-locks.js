const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.Production_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Missing Production_DATABASE_URL or DATABASE_URL in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

const migrationQuery = `
-- Create term_locks table
CREATE TABLE IF NOT EXISTS term_locks (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by INTEGER NOT NULL REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (academic_year_id, class_id, term_id)
);

-- Create term_locks_audit table for logging actions
CREATE TABLE IF NOT EXISTS term_locks_audit (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- 'LOCK' or 'UNLOCK'
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    term_id INTEGER NOT NULL REFERENCES terms(id),
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups by teacher API
CREATE INDEX IF NOT EXISTS idx_term_locks_lookup 
ON term_locks(academic_year_id, class_id, term_id);

-- Index for admin audit view (if needed later)
CREATE INDEX IF NOT EXISTS idx_term_locks_audit_lookup 
ON term_locks_audit(academic_year_id, action_timestamp DESC);
`;

async function runMigration() {
    try {
        console.log("Connecting to database...");
        await client.connect();
        console.log("Connected successfully. Running migration...");

        await client.query(migrationQuery);

        console.log("Migration completed successfully:");
        console.log("- Created term_locks table with unique constraint");
        console.log("- Created term_locks_audit table");
        console.log("- Created indexes for fast lookups");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
        console.log("Database connection closed.");
    }
}

runMigration();
