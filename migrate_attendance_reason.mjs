import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: "postgresql://postgres:ADMIN@localhost:5432/school_erp_hpc",
});

async function main() {
    try {
        const query = `ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS reason_for_low_attendance VARCHAR(255);`;
        await pool.query(query);
        console.log("Successfully added reason_for_low_attendance column.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

main();
