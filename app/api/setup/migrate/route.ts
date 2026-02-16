import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

// This is a temporary endpoint to run migrations on Vercel
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting Migration via API...');

        // 0. Update User Roles Constraint
        try {
            await db.query(`
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                ALTER TABLE users ADD CONSTRAINT users_role_check 
                CHECK (role IN ('ADMIN', 'TEACHER', 'PARENT', 'VIEW_ONLY', 'OFFICE'));
            `);
        } catch (e: any) {
            console.log('Constraint update skipped/failed (non-critical):', e.message);
        }

        // 1. Fee Heads
        await db.query(`
            CREATE TABLE IF NOT EXISTS fee_heads (
                id SERIAL PRIMARY KEY,
                head_name VARCHAR(100) NOT NULL UNIQUE,
                applies_to_new_students_only BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Fee Structures
        await db.query(`
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

        // 3. Fee Payments
        await db.query(`
            CREATE TABLE IF NOT EXISTS fee_payments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                receipt_number VARCHAR(50) UNIQUE NOT NULL,
                amount_paid NUMERIC(10, 2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payment_mode VARCHAR(50) NOT NULL, 
                transaction_reference VARCHAR(100),
                remarks TEXT,
                created_by INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_fp_student FOREIGN KEY (student_id) REFERENCES students(id)
            );
        `);

        // 4. Payment Items
        await db.query(`
            CREATE TABLE IF NOT EXISTS fee_payment_items (
                id SERIAL PRIMARY KEY,
                fee_payment_id INT NOT NULL,
                fee_structure_id INT NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                CONSTRAINT fk_fpi_payment FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id) ON DELETE CASCADE,
                CONSTRAINT fk_fpi_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id)
            );
        `);

        // 5. Seed Fee Heads
        const heads = ['Tuition Fee', 'Annual Charges', 'Admission Fee', 'Exam Fee', 'Transport Fee'];
        for (const head of heads) {
            await db.query(`
                INSERT INTO fee_heads (head_name) VALUES ($1) ON CONFLICT (head_name) DO NOTHING
            `, [head]);
        }

        // 6. Seed OFFICE User
        // Hash for 'office123'
        const passwordHash = '$2b$10$KrTjANQr2CM4ilZ6/K/pD.nc.bG0PIpLdhGh7.w1UhHFxGwsN9s7K';

        await db.query(`
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $4, is_active = $5
        `, ['office', passwordHash, 'School Office', 'OFFICE', true]);

        return NextResponse.json({ success: true, message: 'Migration and Seeding Completed Successfully.' });

    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            { success: false, error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
