import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkConstraints() {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND column_name = 'tenant_id'
        `;
        const res = await pool.query(query);
        console.log("Tables WITH tenant_id:");
        res.rows.forEach(r => console.log(r.table_name));

        const queryAll = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND table_name NOT IN (SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'tenant_id')
        `;
        const resAll = await pool.query(queryAll);
        console.log("\nTables WITHOUT tenant_id (Global):");
        resAll.rows.forEach(r => console.log(r.table_name));
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkConstraints();
