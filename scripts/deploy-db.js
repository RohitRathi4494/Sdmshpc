const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' }); // Try local .env first

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function deploy() {
    console.log('🚀 Starting Database Deployment...');

    try {
        const schemaPath = path.join(__dirname, '..', 'step2_database_schema_v1.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Reading schema file...');

        // Split by semicolon to run statements individually (better error handling)
        // Note: Simple split might break complex functions, but for this schema it's mostly CREATE TABLE
        // For robustness, running the whole block is often better if the driver supports multiple statements.
        // pg-node supports multiple statements in one query.

        console.log('⚡ Executing Schema...');
        await pool.query(schemaSql);

        console.log('✅ Database Deployed Successfully!');

        // Verify
        const res = await pool.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
        console.log('📊 Tables created:', res.rows.map(r => r.tablename).join(', '));

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        await pool.end();
    }
}

deploy();
