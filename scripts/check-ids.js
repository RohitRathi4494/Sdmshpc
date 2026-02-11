
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

async function checkIds() {
    try {
        const client = await pool.connect();

        console.log('--- Classes ---');
        const classes = await client.query('SELECT * FROM classes ORDER BY id');
        console.log(classes.rows);

        console.log('\n--- Sections ---');
        const sections = await client.query('SELECT * FROM sections ORDER BY id');
        console.log(sections.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkIds();
