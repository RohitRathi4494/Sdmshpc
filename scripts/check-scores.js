
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envConfig.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

if (!connectionString) {
    console.error('Could not find DATABASE_URL');
    process.exit(1);
}

const pool = new Pool({ connectionString });

async function checkScores() {
    try {
        const client = await pool.connect();

        console.log('--- Columns in scholastic_scores ---');
        const schema = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'scholastic_scores';
        `);
        console.log(schema.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkScores();
