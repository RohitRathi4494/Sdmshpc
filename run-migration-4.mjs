import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function runMigrate() {
    try {
        const sql = fs.readFileSync('./step4_multitenant_fixes.sql', 'utf8');
        await pool.query(sql);
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}
runMigrate();
