
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

async function updateComponents() {
    try {
        const client = await pool.connect();

        console.log('Adding max_marks to assessment_components...');
        try {
            await client.query(`
                ALTER TABLE assessment_components 
                ADD COLUMN IF NOT EXISTS max_marks INTEGER DEFAULT 100;
            `);
            console.log('Column max_marks added successfully.');
        } catch (e) {
            console.log('Error adding column:', e.message);
        }

        // Update values
        // Periodic Assessment - 30 Marks
        // SEA - 5 Marks
        // IA - 5 marks
        // Terminal Assessment - 60 Marks

        const updates = [
            { name: 'Periodic Assessment', marks: 30 },
            { name: 'Subject Enrichment Activities', marks: 5 },
            { name: 'Internal Assessment', marks: 5 },
            { name: 'Terminal Assessment', marks: 60 }
        ];

        for (const update of updates) {
            const res = await client.query(`
                UPDATE assessment_components 
                SET max_marks = $1 
                WHERE component_name = $2
            `, [update.marks, update.name]);
            console.log(`Updated ${update.name}: ${res.rowCount} row(s)`);
        }

        const res = await client.query('SELECT * FROM assessment_components ORDER BY id');
        console.log('Final State:', res.rows);

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

updateComponents();
