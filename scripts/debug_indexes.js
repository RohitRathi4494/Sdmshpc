
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkIndexes() {
    try {
        console.log('Checking indexes for table: scholastic_scores');
        const res = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'scholastic_scores'");
        console.log(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkIndexes();
