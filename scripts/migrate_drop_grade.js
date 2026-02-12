const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    try {
        console.log('Dropping grade column from scholastic_scores...');
        await pool.query('ALTER TABLE scholastic_scores DROP COLUMN grade');
        console.log('Migration successful: grade column dropped.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
