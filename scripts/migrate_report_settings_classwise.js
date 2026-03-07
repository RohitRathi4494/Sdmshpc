const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Ensure we connect to NEON DB specifically if working in prod space
const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }, // Force SSL for Neon
});

async function migrate() {
    console.log("🚀 Starting Class-wise Report Settings Migration...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log("📄 Adding published_classes column to report_publish_settings...");
        await client.query(`
            ALTER TABLE report_publish_settings
            ADD COLUMN IF NOT EXISTS published_classes INTEGER[] DEFAULT '{}';
        `);
        console.log("✅ Column added.");

        console.log("📄 Migrating existing is_published=true to allow ALL currently active classes...");

        // Find all class IDs
        const classRes = await client.query(`SELECT id FROM classes ORDER BY id`);
        const allClassIds = classRes.rows.map(r => r.id);

        if (allClassIds.length > 0) {
            // Update where is_published is true to have all classes
            await client.query(`
                UPDATE report_publish_settings 
                SET published_classes = $1
                WHERE is_published = TRUE
            `, [allClassIds]);
            console.log("✅ Defaulted active reports to all classes.");
        } else {
            console.log("⚠️ No classes found to default to.");
        }

        await client.query('COMMIT');
        console.log("✅ Migration completed successfully!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Migration failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
