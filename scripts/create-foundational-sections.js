// Add sections for Nursery (id=45), LKG (id=46), UKG (id=47)
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Section names to create for each foundational class
        const sectionNames = ['Rose', 'Lily', 'Lotus', 'Jasmine'];
        const foundationalClassIds = [45, 46, 47]; // Nursery, LKG, UKG

        for (const classId of foundationalClassIds) {
            for (const name of sectionNames) {
                // Only insert if not already exists
                const exists = await client.query(
                    `SELECT id FROM sections WHERE class_id = $1 AND LOWER(section_name) = LOWER($2)`,
                    [classId, name]
                );
                if (exists.rows.length === 0) {
                    const res = await client.query(
                        `INSERT INTO sections (class_id, section_name) VALUES ($1, $2) RETURNING id, class_id, section_name`,
                        [classId, name]
                    );
                    console.log(`✓ Created: class_id=${classId} section="${name}" id=${res.rows[0].id}`);
                } else {
                    console.log(`  Already exists: class_id=${classId} section="${name}" id=${exists.rows[0].id}`);
                }
            }
        }

        await client.query('COMMIT');
        console.log('\nDone ✅');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}
main();
