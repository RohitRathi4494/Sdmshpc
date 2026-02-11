const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('Starting Auth Migration...');

        // 1. Create Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER')),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created users table.');

        // 2. Add class_teacher_id to sections if not exists
        // Check if column exists first to be safe
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='sections' AND column_name='class_teacher_id';
        `);

        if (checkCol.rows.length === 0) {
            await pool.query(`
                ALTER TABLE sections 
                ADD COLUMN class_teacher_id INT REFERENCES users(id);
            `);
            console.log('Added class_teacher_id to sections table.');
        } else {
            console.log('class_teacher_id column already exists.');
        }

        // 3. Seed Default Admin
        const adminHash = await bcrypt.hash('admin', 10);
        const checkAdmin = await pool.query("SELECT * FROM users WHERE username = 'admin'");

        if (checkAdmin.rows.length === 0) {
            await pool.query(`
                INSERT INTO users (username, password_hash, full_name, role)
                VALUES ($1, $2, $3, $4)
            `, ['admin', adminHash, 'System Admin', 'ADMIN']);
            console.log('Seeded default admin user.');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
