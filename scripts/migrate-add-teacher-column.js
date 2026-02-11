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
    console.log('🚀 Starting Schema Migration (Add Teacher Column)...');

    try {
        // Check if column exists
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='sections' AND column_name='class_teacher_id';
        `);

        if (res.rows.length === 0) {
            console.log('⚡ Adding class_teacher_id to sections table...');
            await pool.query(`
                ALTER TABLE sections 
                ADD COLUMN class_teacher_id INT;
            `);

            await pool.query(`
                ALTER TABLE sections
                ADD CONSTRAINT fk_sections_teacher 
                FOREIGN KEY (class_teacher_id) REFERENCES users(id);
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
