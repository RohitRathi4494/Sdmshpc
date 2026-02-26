import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

// This is a temporary endpoint to run migrations on Vercel
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting Complete Migration & Seeding...');

        // --- 1. Create Base Fee Tables (if not exist) ---

        await db.query(`
            CREATE TABLE IF NOT EXISTS fee_heads (
                id SERIAL PRIMARY KEY,
                head_name VARCHAR(100) NOT NULL UNIQUE,
                applies_to_new_students_only BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS fee_structures (
                id SERIAL PRIMARY KEY,
                class_id INT NOT NULL,
                academic_year_id INT NOT NULL,
                fee_head_id INT NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                due_date DATE,
                stream VARCHAR(50),
                subject_count INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_fs_class FOREIGN KEY (class_id) REFERENCES classes(id),
                CONSTRAINT fk_fs_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
                CONSTRAINT fk_fs_head FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS student_fee_payments (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL,
                fee_structure_id INT,
                amount_paid NUMERIC(10, 2) NOT NULL,
                payment_date DATE DEFAULT CURRENT_DATE,
                payment_mode VARCHAR(50) CHECK (payment_mode IN ('CASH', 'UPI', 'CHEQUE', 'ONLINE')),
                transaction_reference VARCHAR(100),
                remarks TEXT,
                academic_year_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_sfp_student FOREIGN KEY (student_id) REFERENCES students(id),
                CONSTRAINT fk_sfp_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
                CONSTRAINT fk_sfp_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
            );
        `);

        // Students: Add columns for Stream, Subject Count, Admission Date, New Student Flag
        await db.query(`
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS stream VARCHAR(50),
            ADD COLUMN IF NOT EXISTS subject_count INT,
            ADD COLUMN IF NOT EXISTS admission_date DATE,
            ADD COLUMN IF NOT EXISTS is_new_student BOOLEAN DEFAULT FALSE;
        `);

        // Payments: Add batch_id for grouping multi-month receipts
        await db.query(`
            ALTER TABLE student_fee_payments
            ADD COLUMN IF NOT EXISTS batch_id VARCHAR(36);
        `);

        // Payments: Drop old mode constraint and recreate with BANK_TRANSFER
        try {
            await db.query(`ALTER TABLE student_fee_payments DROP CONSTRAINT IF EXISTS student_fee_payments_payment_mode_check;`);
            await db.query(`ALTER TABLE student_fee_payments ADD CONSTRAINT student_fee_payments_payment_mode_check CHECK (payment_mode IN ('CASH', 'UPI', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER'));`);
        } catch (e: any) { console.log('Payment mode constraint update skipped:', e.message); }

        // --- 2. Schema Updates ---

        // Academic Years: Add Dates
        await db.query(`
            ALTER TABLE academic_years 
            ADD COLUMN IF NOT EXISTS start_date DATE,
            ADD COLUMN IF NOT EXISTS end_date DATE;
        `);
        // Update default active year dates if not set
        await db.query(`
            UPDATE academic_years 
            SET start_date = '2025-04-01', end_date = '2026-03-31' 
            WHERE year_name = '2025-2026' AND start_date IS NULL;
        `);
        await db.query(`
            UPDATE academic_years 
            SET start_date = '2026-04-01', end_date = '2027-03-31' 
            WHERE year_name = '2026-2027' AND start_date IS NULL;
        `);

        // Fix fee structure due dates that were seeded with wrong year (2025 instead of 2026)
        // This happens when start_date was NULL and the fallback '2025-04-01' was used.
        await db.query(`
            UPDATE fee_structures
            SET due_date = due_date + INTERVAL '1 year'
            WHERE academic_year_id = (
                SELECT id FROM academic_years WHERE year_name = '2026-2027' LIMIT 1
            )
            AND due_date < '2026-04-01';
        `);


        // Fee Heads: New Student Flag
        await db.query(`
            ALTER TABLE fee_heads 
            ADD COLUMN IF NOT EXISTS applies_to_new_students_only BOOLEAN DEFAULT FALSE;
        `);

        // Fee Structures: Add columns for Stream and Subject Count
        await db.query(`
            ALTER TABLE fee_structures 
            ADD COLUMN IF NOT EXISTS stream VARCHAR(50),
            ADD COLUMN IF NOT EXISTS subject_count INT;
        `);

        // Students: Add columns for Stream and Subject Count (if missing)
        await db.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS stream VARCHAR(50),
            ADD COLUMN IF NOT EXISTS subject_count INT;
        `);

        // Fee Structures: Drop Constraints to allow Monthly Fees
        await db.query(`
            ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS uq_fee_structure;
            DROP INDEX IF EXISTS fee_structures_unique_config;
            ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_unique_config;
        `);

        // Users: Role Constraint
        try {
            await db.query(`
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                ALTER TABLE users ADD CONSTRAINT users_role_check 
                CHECK (role IN ('ADMIN', 'TEACHER', 'PARENT', 'VIEW_ONLY', 'OFFICE'));
            `);
        } catch (e: any) { console.log('Role constraint update skipped:', e.message); }


        // --- 2. Seed Data ---

        // A. Seed Classes
        const classes = [
            'Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V',
            'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
        ];
        const classMap: Record<string, number> = {};

        for (let i = 0; i < classes.length; i++) {
            const name = classes[i];
            const order = i + 1;
            const res = await db.query('SELECT id FROM classes WHERE class_name = $1', [name]);
            if (res.rows.length > 0) {
                classMap[name] = res.rows[0].id;
                await db.query('UPDATE classes SET display_order = $1 WHERE id = $2', [order, res.rows[0].id]);
            } else {
                const ins = await db.query('INSERT INTO classes (class_name, display_order) VALUES ($1, $2) RETURNING id', [name, order]);
                classMap[name] = ins.rows[0].id;
            }
        }

        // B. Seed Fee Heads
        const headsNeeded = [
            { name: 'Admission Fee', isNew: true },
            { name: 'Tuition Fee', isNew: false },
            { name: 'Annual Charges', isNew: false },
            { name: 'Exam Fee', isNew: false },
            { name: 'Transport Fee', isNew: false }
        ];
        const headMap: Record<string, number> = {};

        for (const h of headsNeeded) {
            const res = await db.query('SELECT id FROM fee_heads WHERE head_name = $1', [h.name]);
            if (res.rows.length > 0) {
                headMap[h.name] = res.rows[0].id;
                await db.query('UPDATE fee_heads SET applies_to_new_students_only = $1 WHERE id = $2', [h.isNew, res.rows[0].id]);
            } else {
                const ins = await db.query('INSERT INTO fee_heads (head_name, applies_to_new_students_only) VALUES ($1, $2) RETURNING id', [h.name, h.isNew]);
                headMap[h.name] = ins.rows[0].id;
            }
        }

        // C. Seed Fee Structures (Only if empty for this year to avoid duplicates on re-run, or delete first?)
        // Let's safe-guard: Delete existing structure for the active year to allow a fresh "Sync" from code.
        const ayRes = await db.query('SELECT id, start_date FROM academic_years WHERE is_active = true LIMIT 1');
        if (ayRes.rows.length > 0) {
            const ayId = ayRes.rows[0].id;
            const startYear = new Date(ayRes.rows[0].start_date || '2025-04-01').getFullYear();

            // CLEAR EXISTING FEES FOR THIS YEAR
            // Skip if payments already reference these structures (FK constraint would fail)
            const pmtCountRes = await db.query(
                'SELECT COUNT(*) AS cnt FROM student_fee_payments WHERE academic_year_id = $1', [ayId]
            );
            const hasPayments = parseInt(pmtCountRes.rows[0]?.cnt || '0') > 0;

            if (hasPayments) {
                console.log('Skipping fee structure reseed — payments already exist for this year.');
                // Skip fee seeding block entirely
                return NextResponse.json({ success: true, message: 'Migration completed. Fee structures preserved (payments exist).' });
            }

            await db.query('DELETE FROM fee_structures WHERE academic_year_id = $1', [ayId]);

            const insertFee = async (classIds: number[], headId: number, amount: number, isMonthly: boolean, stream: string | null = null, subjectCount: number | null = null) => {
                for (const cid of classIds) {
                    if (isMonthly) {
                        for (let m = 0; m < 12; m++) {
                            let year = startYear;
                            let month = 3 + m; // Apr is 3
                            if (month > 11) { month -= 12; year++; }
                            const dueDate = new Date(Date.UTC(year, month, 10));

                            await db.query(`
                                INSERT INTO fee_structures (class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)
                            `, [cid, ayId, headId, amount, dueDate.toISOString(), stream, subjectCount]);
                        }
                    } else {
                        const dueDate = new Date(Date.UTC(startYear, 3, 1));
                        await db.query(`
                            INSERT INTO fee_structures (class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [cid, ayId, headId, amount, dueDate.toISOString(), stream, subjectCount]);
                    }
                }
            };

            const admHead = headMap['Admission Fee'];
            const tuitionHead = headMap['Tuition Fee'];

            // Seeding Logic (Same as script)
            const getIds = (names: string[]) => names.map(n => classMap[n]).filter(Boolean);

            await insertFee(getIds(['Nursery', 'LKG', 'UKG']), admHead, 20000, false);
            await insertFee(getIds(['Nursery', 'LKG', 'UKG']), tuitionHead, 5000, true);

            await insertFee(getIds(['I', 'II']), admHead, 20000, false);
            await insertFee(getIds(['I', 'II']), tuitionHead, 5200, true);

            await insertFee(getIds(['III', 'IV', 'V']), admHead, 22500, false);
            await insertFee(getIds(['III', 'IV', 'V']), tuitionHead, 5600, true);

            await insertFee(getIds(['VI', 'VII', 'VIII']), admHead, 22500, false);
            await insertFee(getIds(['VI', 'VII', 'VIII']), tuitionHead, 5950, true);

            await insertFee([classMap['IX']], admHead, 25000, false);
            await insertFee([classMap['IX']], tuitionHead, 6600, true);

            await insertFee([classMap['X']], tuitionHead, 6600, true);

            // XI & XII
            const xi = [classMap['XI']];
            const xii = [classMap['XII']];

            // XI
            await insertFee(xi, admHead, 28000, false, 'Medical');
            await insertFee(xi, tuitionHead, 8350, true, 'Medical');
            await insertFee(xi, admHead, 28000, false, 'Non-Medical');
            await insertFee(xi, tuitionHead, 8350, true, 'Non-Medical');
            await insertFee(xi, admHead, 28000, false, 'Commerce', 6);
            await insertFee(xi, tuitionHead, 7800, true, 'Commerce', 6);
            await insertFee(xi, admHead, 28000, false, 'Commerce', 5);
            await insertFee(xi, tuitionHead, 7600, true, 'Commerce', 5);

            // XII (No Admission)
            await insertFee(xii, tuitionHead, 8350, true, 'Medical');
            await insertFee(xii, tuitionHead, 8350, true, 'Non-Medical');
            await insertFee(xii, tuitionHead, 7800, true, 'Commerce', 6);
            await insertFee(xii, tuitionHead, 7600, true, 'Commerce', 5);
        }

        // 3. Seed Office User
        const passwordPlain = 'office123';
        const passwordHash = await bcrypt.hash(passwordPlain, 10);
        await db.query(`
            INSERT INTO users (username, password_hash, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = $4, is_active = $5
        `, ['office', passwordHash, 'School Office', 'OFFICE', true]);

        // 4. Create Sections for all classes (including foundational)
        // First get all existing classes
        const allClasses = await db.query(`SELECT id, class_name FROM classes ORDER BY id`);
        const sectionNames = ['Rose', 'Lily', 'Lotus', 'Jasmine'];
        for (const cls of allClasses.rows) {
            for (const secName of sectionNames) {
                await db.query(`
                    INSERT INTO sections (class_id, section_name)
                    SELECT $1, $2
                    WHERE NOT EXISTS (
                        SELECT 1 FROM sections WHERE class_id = $1 AND LOWER(section_name) = LOWER($2)
                    )
                `, [cls.id, secName]);
            }
        }

        // 5. Foundational HPC tables
        await db.query(`
            CREATE TABLE IF NOT EXISTS foundational_skill_ratings (
                id               SERIAL PRIMARY KEY,
                student_id       INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                academic_year_id INT NOT NULL,
                term             VARCHAR(10) NOT NULL CHECK (term IN ('TERM1','TERM2')),
                domain           VARCHAR(80) NOT NULL,
                skill_key        VARCHAR(120) NOT NULL,
                rating           VARCHAR(5) CHECK (rating IN ('A','B','C')),
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (student_id, academic_year_id, term, domain, skill_key)
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS foundational_text_fields (
                id               SERIAL PRIMARY KEY,
                student_id       INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                academic_year_id INT NOT NULL,
                term             VARCHAR(10) NOT NULL CHECK (term IN ('TERM1','TERM2')),
                field_key        VARCHAR(80) NOT NULL,
                field_value      TEXT,
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                updated_at       TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE (student_id, academic_year_id, term, field_key)
            );
        `);

        return NextResponse.json({
            success: true,
            message: 'Migration and Fee Seeding Completed Successfully.'
        });

    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json(
            { success: false, error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
