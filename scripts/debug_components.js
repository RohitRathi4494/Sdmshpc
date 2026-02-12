const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkComponents() {
    try {
        console.log('Checking assessment_components table...');
        const result = await pool.query('SELECT * FROM assessment_components');
        console.log('Components:', JSON.stringify(result.rows, null, 2));

        console.log('Checking formatting of scholastic_scores...');
        const scores = await pool.query('SELECT * FROM scholastic_scores LIMIT 5');
        console.log('Sample Scores:', JSON.stringify(scores.rows, null, 2));
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkComponents();
