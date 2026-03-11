import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_cDigIX2KlzW7@ep-odd-tree-aiom0qmv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function test() {
    try {
        const yearRes = await pool.query('SELECT * FROM academic_years WHERE is_active = true');
        console.log("Active Year:", yearRes.rows);

        const classRes = await pool.query('SELECT * FROM classes WHERE class_name = \'III\'');
        console.log("Class III:", classRes.rows);
        const classId = classRes.rows[0].id;

        const query = `
            SELECT
                s.subject_name,
                AVG(sc.marks) AS avg_marks
            FROM scholastic_scores sc
            JOIN subjects s ON s.id = sc.subject_id
            JOIN student_enrollments se ON se.student_id = sc.student_id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND sc.academic_year_id = $2
              AND se.section_id = $3
              AND sc.marks IS NOT NULL
            GROUP BY s.subject_name 
            ORDER BY avg_marks DESC;
        `;
        const params = [1, 1, 1]; // classId=1, yearId=1, sectionId=1
        const res = await pool.query(query, params);
        console.log("Subject Performance:", res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
}
test();
