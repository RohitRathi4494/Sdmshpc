const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- 1. Resetting/Seeding Classes ---');
        const classes = [
            'Nursery', 'LKG', 'UKG',
            'I', 'II', 'III', 'IV', 'V',
            'VI', 'VII', 'VIII', 'IX', 'X',
            'XI', 'XII'
        ];

        // We'll use a map to store class_id
        const classMap = {};

        for (let i = 0; i < classes.length; i++) {
            const name = classes[i];
            const order = i + 1;

            // Check if exists
            const res = await client.query('SELECT id FROM classes WHERE class_name = $1', [name]);
            if (res.rows.length > 0) {
                classMap[name] = res.rows[0].id;
                await client.query('UPDATE classes SET display_order = $1 WHERE id = $2', [order, classMap[name]]);
            } else {
                const ins = await client.query(
                    'INSERT INTO classes (class_name, display_order) VALUES ($1, $2) RETURNING id',
                    [name, order]
                );
                classMap[name] = ins.rows[0].id;
            }
        }
        console.log('Classes seeded:', classMap);

        console.log('--- 2. Setting up Fee Heads ---');
        // Define Heads
        const headsNeeded = [
            { name: 'Admission Fee', isNew: true },
            { name: 'Tuition Fee', isNew: false } // "Composite Fee" in chart, mapping to Tuition Fee
        ];

        const headMap = {};
        for (const h of headsNeeded) {
            const res = await client.query('SELECT id FROM fee_heads WHERE head_name = $1', [h.name]);
            if (res.rows.length > 0) {
                headMap[h.name] = res.rows[0].id;
                await client.query('UPDATE fee_heads SET applies_to_new_students_only = $1 WHERE id = $2', [h.isNew, headMap[h.name]]);
            } else {
                const ins = await client.query(
                    'INSERT INTO fee_heads (head_name, applies_to_new_students_only) VALUES ($1, $2) RETURNING id',
                    [h.name, h.isNew]
                );
                headMap[h.name] = ins.rows[0].id;
            }
        }
        console.log('Fee Heads:', headMap);

        console.log('--- 3. Getting Active Academic Year ---');
        const ayRes = await client.query('SELECT id, start_date FROM academic_years WHERE is_active = true LIMIT 1');
        if (ayRes.rows.length === 0) throw new Error('No active academic year found!');
        const ayId = ayRes.rows[0].id;
        const ayStartYear = new Date(ayRes.rows[0].start_date).getFullYear(); // e.g., 2025

        console.log('--- 4. Seeding Fee Structures ---');
        // Clear existing for this year (optional, but good for reset)
        await client.query('DELETE FROM fee_structures WHERE academic_year_id = $1', [ayId]);

        // Helper to insert fee
        const insertFee = async (classIds, headId, amount, isMonthly, stream = null, subjectCount = null) => {
            if (!Array.isArray(classIds)) classIds = [classIds];

            for (const cid of classIds) {
                if (isMonthly) {
                    // Generate 12 entries
                    for (let m = 0; m < 12; m++) {
                        // Apr (3) to Mar (2 next year)
                        // Month is 0-indexed in JS Date? No, let's use logic.
                        // Start Date is Apr 1, 2025.
                        // Due dates: Apr 10, May 10...
                        let year = ayStartYear;
                        let month = 3 + m; // Apr is 3 (if Jan is 0)
                        if (month > 11) {
                            month -= 12;
                            year++;
                        }

                        // Create Date: 10th of the month
                        const dueDate = new Date(Date.UTC(year, month, 10)); // UTC to avoid timezone shifts jumping dates

                        await client.query(`
                            INSERT INTO fee_structures 
                            (class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [cid, ayId, headId, amount, dueDate.toISOString(), stream, subjectCount]);
                    }
                } else {
                    // One Time (Admission Fee)
                    const dueDate = new Date(Date.UTC(ayStartYear, 3, 1)); // Apr 1
                    await client.query(`
                        INSERT INTO fee_structures 
                        (class_id, academic_year_id, fee_head_id, amount, due_date, stream, subject_count)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [cid, ayId, headId, amount, dueDate.toISOString(), stream, subjectCount]);
                }
            }
        };

        // --- Data Entry based on Chart ---
        const admHead = headMap['Admission Fee'];
        const tuitionHead = headMap['Tuition Fee'];

        // NURSERY - UKG
        const nurUkg = [classMap['Nursery'], classMap['LKG'], classMap['UKG']].filter(Boolean);
        await insertFee(nurUkg, admHead, 20000, false);
        await insertFee(nurUkg, tuitionHead, 5000, true);

        // I - II
        const oneTwo = [classMap['I'], classMap['II']].filter(Boolean);
        await insertFee(oneTwo, admHead, 20000, false);
        await insertFee(oneTwo, tuitionHead, 5200, true);

        // III - V
        const threeFive = [classMap['III'], classMap['IV'], classMap['V']].filter(Boolean);
        await insertFee(threeFive, admHead, 22500, false);
        await insertFee(threeFive, tuitionHead, 5600, true);

        // VI - VIII
        const sixEight = [classMap['VI'], classMap['VII'], classMap['VIII']].filter(Boolean);
        await insertFee(sixEight, admHead, 22500, false);
        await insertFee(sixEight, tuitionHead, 5950, true);

        // IX
        await insertFee(classMap['IX'], admHead, 25000, false);
        await insertFee(classMap['IX'], tuitionHead, 6600, true);

        // X (No Admission Fee for Existing? Schema says "NA" for Admission Fee. 
        // User said: "first column... is only for new admissions". 
        // Table shows NA for Class X. This implies NO new admissions in Class X? 
        // Or if there are, fee is NA? I will skip Admission Fee for X.)
        await insertFee(classMap['X'], tuitionHead, 6600, true);

        // XI
        // Medical & Non-Medical (Stream)
        // I need to know exact stream names stored in DB. Assuming 'Medical', 'Non-Medical'.
        // Or if they are grouped as 'Science'? User wrote "Medical & Non Medical".
        // I will insert for BOTH 'Medical' and 'Non-Medical' explicitly.

        const xi = classMap['XI'];
        const xii = classMap['XII'];

        // XI Streams
        // Medical
        await insertFee(xi, admHead, 28000, false, 'Medical');
        await insertFee(xi, tuitionHead, 8350, true, 'Medical');
        // Non-Medical
        await insertFee(xi, admHead, 28000, false, 'Non-Medical');
        await insertFee(xi, tuitionHead, 8350, true, 'Non-Medical');

        // XI Commerce (6 Subjects)
        await insertFee(xi, admHead, 28000, false, 'Commerce', 6);
        await insertFee(xi, tuitionHead, 7800, true, 'Commerce', 6);
        // XI Commerce (5 Subjects)
        await insertFee(xi, admHead, 28000, false, 'Commerce', 5);
        await insertFee(xi, tuitionHead, 7600, true, 'Commerce', 5);

        // Humanities/Arts? Not in chart. Skipping.

        // XII Streams (No Admission Fee)
        // Medical
        await insertFee(xii, tuitionHead, 8350, true, 'Medical');
        // Non-Medical
        await insertFee(xii, tuitionHead, 8350, true, 'Non-Medical');
        // Commerce (6 Subjects)
        await insertFee(xii, tuitionHead, 7800, true, 'Commerce', 6);
        // Commerce (5 Subjects)
        await insertFee(xii, tuitionHead, 7600, true, 'Commerce', 5);

        await client.query('COMMIT');
        console.log('Seeding Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
