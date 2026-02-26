require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    // Show ALL classes
    const cls = await pool.query(`SELECT id, class_name FROM classes ORDER BY id`);
    console.log('All classes:');
    cls.rows.forEach(c => console.log(` id=${c.id} name="${c.class_name}"`));

    // Show sections and which class they belong to
    const sec = await pool.query(`
        SELECT s.id, s.section_name, s.class_id, c.class_name
        FROM sections s
        LEFT JOIN classes c ON c.id = s.class_id
        ORDER BY s.class_id, s.id
    `);
    console.log('\nAll sections:');
    sec.rows.forEach(s => console.log(` sec_id=${s.id} name="${s.section_name}" class_id=${s.class_id} class_name="${s.class_name}"`));

    await pool.end();
}
main().catch(console.error);
