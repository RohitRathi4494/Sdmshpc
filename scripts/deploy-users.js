const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

async function deployUsers() {
    console.log('🚀 Deploying Users Table...');

    try {
        // 1. Create Table
        console.log('creating table...');
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

        // 2. Hash Password
        const password = 'admin';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert Admin
        console.log('seeding admin...');
        const query = `
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING;
        `;
        await pool.query(query, ['admin', hashedPassword, 'Administrator', 'ADMIN', true]);

        console.log('✅ Users table created and Admin seeded!');

    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        await pool.end();
    }
}

deployUsers();
