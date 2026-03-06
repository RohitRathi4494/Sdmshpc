const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log("Renaming domain 'Physical Education' to 'Communication'...");

        // 1. Rename Domain
        await client.query(`
      UPDATE domains 
      SET domain_name = 'Communication' 
      WHERE domain_name = 'Physical Education'
    `);

        // Fetch the updated domain to get its ID
        const domainRes = await client.query(`SELECT id FROM domains WHERE domain_name = 'Communication' LIMIT 1`);
        if (domainRes.rows.length === 0) {
            throw new Error("Communication domain not found. Aborting.");
        }
        const domainId = domainRes.rows[0].id;

        console.log(`Domain updated successfully (ID: ${domainId}). Renaming sub-skills...`);

        // 2. Fetch the 4 Sub-Skills explicitly by ID so that we overwrite them sequentially
        // Our previous script identified the IDs as: 1, 2, 3, 4

        const updates = [
            { id: 1, name: 'Articulation & Clarity in Expression' },
            { id: 2, name: 'Active Listening & Understanding' },
            { id: 3, name: 'Confidence in Public Speaking' },
            { id: 4, name: 'Vocabulary Usage & Language Fluency' },
        ];

        for (const update of updates) {
            await client.query(`
        UPDATE sub_skills
        SET sub_skill_name = $1
        WHERE id = $2 AND domain_id = $3
      `, [update.name, update.id, domainId]);
        }

        console.log("Sub-skills updated successfully. Verifying...");

        const verify = await client.query(`
      SELECT * FROM sub_skills WHERE domain_id = $1 ORDER BY id ASC
    `, [domainId]);

        console.log("Final Sub-skills in DB:", verify.rows);

        await client.query('COMMIT');
        console.log("✅ Database update committed successfully.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error occurred, rolling back changes:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
