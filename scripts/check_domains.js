const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        const domains = await pool.query("SELECT * FROM domains WHERE domain_name = 'Physical Education' OR domain_name = 'Communication'");
        console.log("Domains:", domains.rows);

        const subSkills = await pool.query(`
      SELECT s.*, d.domain_name 
      FROM sub_skills s
      JOIN domains d ON s.domain_id = d.id
      WHERE d.domain_name IN ('Physical Education', 'Communication')
    `);
        console.log("Sub Skills:", subSkills.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

main();
