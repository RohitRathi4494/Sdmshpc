const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    console.log('🔍 Connecting to database...');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'students'
        `);

        console.log('\n📊 Columns in "students" table:');
        console.table(res.rows);

    } catch (err) {
        console.error('❌ Error querying database:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
