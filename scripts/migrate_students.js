const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Connected to database');

        const query = `
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS admission_date DATE,
      ADD COLUMN IF NOT EXISTS student_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
      ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS phone_no VARCHAR(20),
      ADD COLUMN IF NOT EXISTS emergency_no VARCHAR(20),
      ADD COLUMN IF NOT EXISTS category VARCHAR(20),
      ADD COLUMN IF NOT EXISTS ppp_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS apaar_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS aadhar_no VARCHAR(20),
      ADD COLUMN IF NOT EXISTS board_roll_x VARCHAR(50),
      ADD COLUMN IF NOT EXISTS board_roll_xii VARCHAR(50),
      ADD COLUMN IF NOT EXISTS education_reg_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS srn_no VARCHAR(50);
    `;

        await client.query(query);
        console.log('Migration completed: Added new columns to students table.');
        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
