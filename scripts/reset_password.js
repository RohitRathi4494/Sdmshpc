const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function resetPassword() {
    try {
        await client.connect();

        const username = await new Promise(resolve => {
            rl.question('Enter username to reset: ', resolve);
        });

        // Check if user exists
        const checkRes = await client.query('SELECT id, role FROM users WHERE username = $1', [username]);
        if (checkRes.rows.length === 0) {
            console.error(`User '${username}' not found!`);
            process.exit(1);
        }

        const newPassword = await new Promise(resolve => {
            rl.question('Enter new password: ', resolve);
        });

        if (!newPassword || newPassword.length < 6) {
            console.error('Password must be at least 6 characters long.');
            process.exit(1);
        }

        const confirmPassword = await new Promise(resolve => {
            rl.question('Confirm new password: ', resolve);
        });

        if (newPassword !== confirmPassword) {
            console.error('Passwords do not match!');
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await client.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashedPassword, username]);

        console.log(`\n✅ Password for user '${username}' has been successfully reset.`);

    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
        rl.close();
    }
}

resetPassword();
