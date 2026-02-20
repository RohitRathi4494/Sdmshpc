import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

// This is a temporary endpoint to run migrations on Vercel
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Starting Complete Migration & Seeding...');

        // --- 1. Schema Updates ---

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

        // Fee Heads: New Student Flag
        await db.query(`
            ALTER TABLE fee_heads 
            ADD COLUMN IF NOT EXISTS applies_to_new_students_only BOOLEAN DEFAULT FALSE;
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
