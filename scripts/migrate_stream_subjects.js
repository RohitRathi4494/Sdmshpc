const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding Stream and Subject Count...');
        await client.query('BEGIN');

        // Add stream column (Medical, Non-Medical, Commerce, Humanities, etc.)
        await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS stream VARCHAR(50);
    `);
        console.log('Added stream column.');

        // Add subject_count column (e.g. 5 or 6)
        // Defaulting to 5 as most students have 5. nullable is fine too.
        await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS subject_count INTEGER DEFAULT 5;
    `);
        console.log('Added subject_count column.');

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
