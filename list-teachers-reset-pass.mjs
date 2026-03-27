import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function listTeachers() {
    try {
        console.log("Listing all teachers...");
        const res = await pool.query(`
            SELECT u.username, u.full_name, u.role, t.school_code 
            FROM users u 
            JOIN tenants t ON u.tenant_id = t.id 
            WHERE u.role = 'TEACHER'
        `);
        console.log("Teachers found:", JSON.stringify(res.rows, null, 2));

        // Let's also reset pinkisethi's password to 'Teacher@123'
        const newPassword = 'Teacher@123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log(`Resetting password for pinkisethi to: ${newPassword}`);
        const updateRes = await pool.query(`
            UPDATE users SET password_hash = $1 WHERE username = 'pinkisethi'
        `, [hash]);

        if (updateRes.rowCount > 0) {
            console.log("Password reset successful.");
        } else {
            console.log("User pinkisethi not found for password reset.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}
listTeachers();
