const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function testFeeLogic(studentId) {
    const client = await pool.connect();
    try {
        console.log(`Testing fee logic for student ID: ${studentId}`);

        // 1. Get Student Data
        const studentRes = await client.query(`
            SELECT s.student_name, s.admission_no, s.stream, s.subject_count,
                   se.class_id, se.academic_year_id,
                   c.class_name, ay.year_name, ay.start_date
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN academic_years ay ON se.academic_year_id = ay.id
            WHERE s.id = $1
            ORDER BY ay.is_active DESC
            LIMIT 1
        `, [studentId]);

        if (studentRes.rows.length === 0) {
            console.log('Student not found in DB');
            return;
        }

        const studentData = studentRes.rows[0];
        console.log('Student Data:', studentData);

        const { class_id, academic_year_id, stream, subject_count, start_date } = studentData;

        // 2. Check New Admission Logic
        const studentAdmRes = await client.query('SELECT admission_date FROM students WHERE id = $1', [studentId]);
        const admissionDate = studentAdmRes.rows[0]?.admission_date;

        let isNewStudent = false;
        if (start_date && admissionDate) {
            isNewStudent = new Date(admissionDate) >= new Date(start_date);
        }
        console.log(`Is New Student? ${isNewStudent} (Adm: ${admissionDate}, YearStart: ${start_date})`);

        // 3. Query Fee Structures
        // This is the complex query from the API
        const query = `
            SELECT DISTINCT ON (fs.fee_head_id) 
                fs.id, fs.amount, fs.stream, fs.subject_count,
                fh.head_name
            FROM fee_structures fs
            JOIN fee_heads fh ON fs.fee_head_id = fh.id
            WHERE fs.class_id = $1 
              AND fs.academic_year_id = $2
              AND (fs.stream IS NULL OR fs.stream = $3)
              AND (fs.subject_count IS NULL OR fs.subject_count = $4)
              AND (
                  fh.applies_to_new_students_only = false OR 
                  (fh.applies_to_new_students_only = true AND $5 = true)
              )
            ORDER BY fs.fee_head_id, 
                     (CASE WHEN fs.stream IS NOT NULL THEN 1 ELSE 0 END + 
                      CASE WHEN fs.subject_count IS NOT NULL THEN 1 ELSE 0 END) DESC
        `;

        const values = [class_id, academic_year_id, stream || null, subject_count || null, isNewStudent];
        console.log('Query Values:', values);

        const structRes = await client.query(query, values);
        console.log('Fee Structures Found:', structRes.rows);

    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

// Arbitrary ID from previous screenshot (Aanya Jaiswal - 5776)
// Wait, 5776 is Adm No. We need ID. 
// Let's first find ID for Adm No 5776
async function run() {
    const client = await pool.connect();
    const res = await client.query("SELECT id FROM students WHERE admission_no = '5776'");
    client.release();
    if (res.rows.length > 0) {
        await testFeeLogic(res.rows[0].id);
    } else {
        console.log("Could not find student 5776 to test with. Testing with ID 1.");
        await testFeeLogic(1);
    }
    await pool.end();
}

run();
