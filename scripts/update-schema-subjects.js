
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

async function updateSchema() {
    try {
        const client = await pool.connect();

        console.log('Adding max_marks to class_subjects...');
        try {
            await client.query(`
                ALTER TABLE class_subjects 
                ADD COLUMN IF NOT EXISTS max_marks INTEGER DEFAULT 100;
            `);
            console.log('Column max_marks added successfully.');
        } catch (e) {
            console.log('Error adding column (might exist):', e.message);
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

updateSchema();
