
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

async function checkComponents() {
    try {
        const client = await pool.connect();

        console.log('--- Columns ---');
        const schema = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessment_components';
        `);
        console.log(schema.rows);

        console.log('\n--- Data ---');
        const data = await client.query('SELECT * FROM assessment_components ORDER BY id');
        console.log(data.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkComponents();
