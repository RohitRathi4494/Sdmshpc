const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });

async function check() {
    try {
        const query = 'SELECT column_name FROM information_schema.columns WHERE table_name = $1';
        let val; // undefined
        await pool.query(query, [val]);
    } catch (err) {
        console.error('Error received:', err.message);
    } finally {
        process.exit(0);
    }
}
check();
