const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
}

const pool = new Pool({
    connectionString
});

async function migrate() {
    console.log('🚀 Starting Report Visibility Settings Migration...');

    try {
        console.log('📄 Creating report_publish_settings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS report_publish_settings (
                id SERIAL PRIMARY KEY,
                academic_year_id INT NOT NULL,
                report_type VARCHAR(50) NOT NULL,
                is_published BOOLEAN DEFAULT TRUE,
                UNIQUE (academic_year_id, report_type),
                CONSTRAINT fk_rps_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Table created.');

        console.log('📄 Fetching academic years...');
        const res = await pool.query('SELECT id FROM academic_years');
        const years = res.rows;

        const reportTypes = ['PA1', 'TA1', 'PA2', 'TA2', 'FULL_HPC', 'CUMULATIVE'];

        console.log('📄 Seeding default published settings...');
        for (const year of years) {
            for (const type of reportTypes) {
                await pool.query(`
                    INSERT INTO report_publish_settings (academic_year_id, report_type, is_published)
                    VALUES ($1, $2, TRUE)
                    ON CONFLICT (academic_year_id, report_type) DO NOTHING
                `, [year.id, type]);
            }
        }

        console.log('✅ Default settings seeded successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
