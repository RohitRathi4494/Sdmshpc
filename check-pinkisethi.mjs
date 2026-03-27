import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkUser() {
    try {
        console.log("Searching for user 'pinkisethi'...");
        const res = await pool.query(`
            SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.tenant_id, u.password_hash, t.school_code, t.school_name 
            FROM users u 
            JOIN tenants t ON u.tenant_id = t.id 
            WHERE u.username = $1
        `, ['pinkisethi']);
        
        if (res.rows.length === 0) {
            console.log("User 'pinkisethi' not found.");
            // Search with ILIKE just in case
            const res2 = await pool.query(`
                SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.tenant_id, t.school_code 
                FROM users u 
                JOIN tenants t ON u.tenant_id = t.id 
                WHERE u.username ILIKE $1
            `, ['%pinkisethi%']);
            console.log("Similar users found:", res2.rows);
        } else {
            const user = res.rows[0];
            console.log("User details:", JSON.stringify({ ...user, password_hash: user.password_hash ? `HIDDEN (length: ${user.password_hash.length})` : 'MISSING' }, null, 2));
        }
    } catch (e) {
        console.error("Error checking user:", e);
    } finally {
        await pool.end();
    }
}
checkUser();
