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
        const query = `
            SELECT
                st.student_name,
                SUM(sc.marks) AS total_obtained,
                SUM(COALESCE((cs.assessment_max_marks->>sc.component_id::text)::numeric, cs.max_marks, 100)) AS total_max,
                (SUM(sc.marks) / NULLIF(SUM(COALESCE((cs.assessment_max_marks->>sc.component_id::text)::numeric, cs.max_marks, 100)), 0) * 100) AS percentage
            FROM scholastic_scores sc
            JOIN students st ON st.id = sc.student_id
            JOIN student_enrollments se ON se.student_id = st.id AND se.academic_year_id = sc.academic_year_id
            JOIN class_subjects cs ON cs.subject_id = sc.subject_id AND cs.class_id = se.class_id AND cs.academic_year_id = sc.academic_year_id
            WHERE se.class_id = $1
              AND se.academic_year_id = $2
              AND sc.academic_year_id = $2
              AND sc.marks IS NOT NULL
            GROUP BY st.student_name 
            ORDER BY percentage DESC
            LIMIT 10;
        `;
        const params = [1, 1]; // classId=1, yearId=1
        const res = await pool.query(query, params);
        console.log("Top Students:", res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit();
    }
}
test();
