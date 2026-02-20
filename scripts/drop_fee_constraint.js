const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Dropping uq_fee_structure constraint ---');

        await client.query(`
            DROP INDEX IF EXISTS fee_structures_unique_config;
            ALTER TABLE fee_structures 
            DROP CONSTRAINT IF EXISTS uq_fee_structure;
            ALTER TABLE fee_structures
            DROP CONSTRAINT IF EXISTS fee_structures_unique_config;
        `);

        console.log('Constraint dropped successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
