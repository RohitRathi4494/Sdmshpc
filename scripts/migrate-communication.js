const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('Starting Communication Module Migration...');

        // 1. Create Notices Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sender_id INTEGER REFERENCES users(id)
            );
        `);
        console.log('Created notices table (or already exists).');

        // 2. Create Notice Recipients Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notice_recipients (
                id SERIAL PRIMARY KEY,
                notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
                recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('CLASS', 'STUDENT')),
                recipient_id INTEGER NOT NULL
            );
        `);
        console.log('Created notice_recipients table (or already exists).');

        // 3. Create Index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notice_recipients_target ON notice_recipients(recipient_type, recipient_id);
        `);
        console.log('Created index on notice_recipients.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
