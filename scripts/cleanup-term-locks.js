const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.Production_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("Missing DB URL");
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function runCleanup() {
    try {
        await client.connect();
        await client.query('DROP TABLE IF EXISTS term_locks_audit CASCADE');
        await client.query('DROP TABLE IF EXISTS term_locks CASCADE');
        console.log("term_locks tables dropped successfully.");
    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        await client.end();
    }
}

runCleanup();
