const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false } // Disabled for local dev
});

async function migrate() {
    try {
        console.log('Starting Fees Migration...');

        // 0. Update User Roles Constraint to allow OFFICE
        try {
            await pool.query(`
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                ALTER TABLE users ADD CONSTRAINT users_role_check 
                CHECK (role IN ('ADMIN', 'TEACHER', 'PARENT', 'VIEW_ONLY', 'OFFICE'));
            `);
            console.log('Updated users role constraint.');
        } catch (e) {
            console.log('Error updating constraint (might not exist):', e.message);
        }

        // 1. Fee Heads
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fee_heads (
                id SERIAL PRIMARY KEY,
                head_name VARCHAR(100) NOT NULL UNIQUE,
                applies_to_new_students_only BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created fee_heads table.');

        // 2. Fee Structures (Demands)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fee_structures (
                id SERIAL PRIMARY KEY,
                class_id INT NOT NULL,
                academic_year_id INT NOT NULL,
                fee_head_id INT NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                due_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_fs_class FOREIGN KEY (class_id) REFERENCES classes(id),
                CONSTRAINT fk_fs_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
                CONSTRAINT fk_fs_head FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id),
                CONSTRAINT uq_fee_structure UNIQUE (class_id, academic_year_id, fee_head_id)
            );
        `);
        console.log('Created fee_structures table.');

        // 3. Student Fee Payments (Transactions)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_fee_payments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                fee_structure_id INT, -- Optional: if paying specific head (nullable)
                amount_paid NUMERIC(10, 2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_mode VARCHAR(50) CHECK (payment_mode IN ('CASH', 'UPI', 'CHEQUE', 'ONLINE')),
                transaction_reference VARCHAR(100),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_sfp_student FOREIGN KEY (student_id) REFERENCES students(id),
                CONSTRAINT fk_sfp_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id)
            );
        `);
        console.log('Created student_fee_payments table.');


        // 5. Seed Fee Heads
        const heads = ['Tuition Fee', 'Annual Charges', 'Admission Fee', 'Exam Fee', 'Transport Fee'];
        for (const head of heads) {
            await pool.query(`
                INSERT INTO fee_heads (head_name) 
                VALUES ($1) 
                ON CONFLICT (head_name) DO NOTHING
            `, [head]);
        }
        console.log('Seeded Fee Heads.');

        // 6. Create Office User
        const hashedPassword = await bcrypt.hash('office123', 10);
        await pool.query(`
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING
        `, ['office', hashedPassword, 'School Office', 'OFFICE', true]);
        console.log('Seeded OFFICE user.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
