const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Use Production_DATABASE_URL if available, otherwise fallback to standard DATABASE_URL.
const dbUrl = process.env.Production_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Missing DB URL in .env.local");
    process.exit(1);
}

// Ensure SSL is used for external connections (like Neon)
const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

const migrationQuery = `
-- Add status column to students table if it doesn't already exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Set existing nulls to ACTIVE just in case
UPDATE students 
SET status = 'ACTIVE' 
WHERE status IS NULL;
`;

async function runMigration() {
    try {
        await client.connect();
        console.log(`Connected to database. Applying migration...`);

        await client.query(migrationQuery);
        console.log("Migration completed successfully: 'status' column added to 'students'.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
        console.log("Database connection closed.");
    }
}

runMigration();
