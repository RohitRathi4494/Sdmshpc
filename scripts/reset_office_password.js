const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ADMIN@localhost:5432/school_erp_hpc',
    // ssl: { rejectUnauthorized: false } // Disabled for local
});

async function reset() {
    try {
        await client.connect();

        const hashedPassword = await bcrypt.hash('office123', 10);
        console.log('Generated hash:', hashedPassword);

        const res = await client.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
            [hashedPassword, 'office']
        );

        if (res.rowCount > 0) {
            console.log('Password reset successfully for:', res.rows[0]);
        } else {
            console.log('User "office" not found.');
        }

    } catch (e) {
        console.error('Error resetting password:', e);
    } finally {
        await client.end();
    }
}

reset();
