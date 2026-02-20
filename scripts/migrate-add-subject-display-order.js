const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log('🚀 Starting Schema Migration (Add Display Order to Class Subjects)...');

    try {
        // Check if column exists
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='class_subjects' AND column_name='display_order';
        `);

        if (res.rows.length === 0) {
            console.log('⚡ Adding display_order to class_subjects table...');
            await pool.query(`
                ALTER TABLE class_subjects 
                ADD COLUMN display_order INTEGER DEFAULT 0;
            `);
            console.log('✅ Column added successfully!');
        } else {
            console.log('ℹ️ Column already exists. Skipping.');
        }

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
