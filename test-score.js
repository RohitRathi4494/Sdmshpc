import { db } from './app/lib/db.js';

async function test() {
    try {
        const yearRes = await db.query('SELECT * FROM academic_years WHERE is_active = true');
        console.log("Active Year:", yearRes.rows);

        const classRes = await db.query('SELECT * FROM classes WHERE class_name = \'III\'');
        console.log("Class III:", classRes.rows);
        const classId = classRes.rows[0].id;

        const secRes = await db.query('SELECT * FROM sections WHERE section_name = \'Rose\' AND class_id = $1', [classId]);
        console.log("Section Rose:", secRes.rows);

        const scoreRes = await db.query('SELECT COUNT(*) FROM scholastic_scores WHERE academic_year_id = $1', [yearRes.rows[0].id]);
        console.log("Count of scores in active year:", scoreRes.rows);

        const enrollScoreRes = await db.query(`
            SELECT sc.* 
            FROM scholastic_scores sc
            JOIN student_enrollments se ON se.student_id = sc.student_id
            WHERE se.class_id = $1 AND sc.academic_year_id = $2
            LIMIT 5
        `, [classId, yearRes.rows[0].id]);
        console.log("Scores joined with enrollments:", enrollScoreRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
