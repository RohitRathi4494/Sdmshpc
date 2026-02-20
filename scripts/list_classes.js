const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function listClasses() {
    console.log('🔍 Fetching classes...');
    try {
        const res = await pool.query(`
            SELECT id, class_name, display_order 
            FROM classes 
            ORDER BY display_order ASC
        `);

        console.table(res.rows);

    } catch (err) {
        console.error('❌ Error querying database:', err.message);
    } finally {
        await pool.end();
    }
}

listClasses();
