import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkConstraints() {
    try {
        const query = `
            SELECT conname, conrelid::regclass, contype
            FROM pg_constraint
            WHERE contype = 'u'
            AND conrelid::regclass::text IN (
                'users', 'students', 'classes', 'sections', 'subjects', 'academic_years'
            );
        `;
        const res = await pool.query(query);
        console.log("Constraints:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkConstraints();
