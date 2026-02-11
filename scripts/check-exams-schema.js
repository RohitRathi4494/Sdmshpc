
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

async function checkSchema() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
        `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        const exams = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exams';
        `);
        console.log('Columns in exams:', exams.rows);

        // Also check if there's a separate 'assessments' table or if exams table holds the component data
        const assessments = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessments';
        `);
        if (assessments.rows.length > 0) {
            console.log('Columns in assessments:', assessments.rows);
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
