const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function checkYear() {
    try {
        console.log('Checking academic_years table...');
        const result = await pool.query('SELECT * FROM academic_years');
        console.log('Row count:', result.rows.length);
        console.log('Rows:', JSON.stringify(result.rows, null, 2));

        const active = result.rows.find(r => r.is_active);
        if (active) {
            console.log('Found active year:', active.year_name);
        } else {
            console.log('NO ACTIVE YEAR FOUND');
        }
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await pool.end();
    }
}

checkYear();
