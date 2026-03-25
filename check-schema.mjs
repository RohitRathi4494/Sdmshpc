import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
    try {
        const query = `
            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users';
        `;
        const res = await pool.query(query);
        console.log("Users Schema:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkSchema();
