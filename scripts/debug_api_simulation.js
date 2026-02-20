const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function debugApi() {
    const client = await pool.connect();
    try {
        console.log('--- Simulating API /api/admin/students?academic_year_id=1&status=enrolled ---');

        const academic_year_id = 1;
        const status = 'enrolled';
        const class_id = null; // Simulating no class filter
        const section_id = null;

        let query = '';
        const values = [];

        if (status === 'unenrolled' && academic_year_id) {
            // ... (unenrolled logic)
        } else if (class_id && academic_year_id) {
            // ... (class logic)
        } else {
            // Default: List all students (maybe limit?)
            // THIS IS THE BLOCK THAT EXECUTED IN THE API CODE FOR THE GIVEN PARAMS (no class_id)
            query = 'SELECT * FROM students ORDER BY id DESC LIMIT 100';
            // WAIT! The API logic I saw earlier ONLY handles 'unenrolled' OR 'class_id && academic_year_id'.
            // It DOES NOT have a block for 'status=enrolled' WITHOUT class_id.
            // It falls through to the 'else' block which fetches ALL students from 'students' table,
            // NOT filtering by Enrollment or Academic Year!

            console.log('Executing Default Query:', query);
        }

        const { rows } = await client.query(query, values);
        console.log('Rows Returned:', rows.length);
        if (rows.length > 0) {
            console.log('Sample Row:', rows[0]);
        }

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

debugApi();
