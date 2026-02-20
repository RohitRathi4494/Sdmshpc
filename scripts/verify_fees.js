const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function verify() {
    const client = await pool.connect();
    try {
        console.log('--- Verifying Fee Structure for Class X ---');

        // Get Class ID for I
        const clsRes = await client.query("SELECT id FROM classes WHERE class_name = 'I'");
        const clsId = clsRes.rows[0].id;

        const res = await client.query(`
            SELECT fs.amount, fs.due_date, fh.head_name
            FROM fee_structures fs
            JOIN fee_heads fh ON fs.fee_head_id = fh.id
            WHERE fs.class_id = $1
            ORDER BY fs.due_date
        `, [clsId]);

        console.table(res.rows.map(r => ({
            head: r.head_name,
            amount: r.amount,
            due: new Date(r.due_date).toDateString()
        })));

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

verify();
