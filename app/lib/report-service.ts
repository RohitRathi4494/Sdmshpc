import { db } from '@/app/lib/db';

export async function getStudentReportData(student_id: number, academic_year_id: number) {
  // 1. Student Info
  const studentQuery = `
    SELECT s.*, c.class_name, sec.section_name, ay.year_name, se.roll_no, se.class_id
    FROM students s
    JOIN student_enrollments se ON s.id = se.student_id
    JOIN classes c ON se.class_id = c.id
    JOIN sections sec ON se.section_id = sec.id
    JOIN academic_years ay ON se.academic_year_id = ay.id
    WHERE s.id = $1 AND se.academic_year_id = $2
  `;
  const studentRes = await db.query(studentQuery, [student_id, academic_year_id]);

  if (studentRes.rows.length === 0) {
    return null;
  }
  const student = studentRes.rows[0];

  // 2. Scholastic Scores
  const scholasticQuery = `
    SELECT ss.*, sub.subject_name, ac.component_name, t.term_name
    FROM scholastic_scores ss
    JOIN subjects sub ON ss.subject_id = sub.id
    JOIN assessment_components ac ON ss.component_id = ac.id
    JOIN terms t ON ss.term_id = t.id
    WHERE ss.student_id = $1 AND ss.academic_year_id = $2
  `;
  const scholasticRes = await db.query(scholasticQuery, [student_id, academic_year_id]);

  // 3. Co-Scholastic Scores
  const coScholasticQuery = `
    SELECT css.*, ss.sub_skill_name, d.domain_name, t.term_name
    FROM co_scholastic_scores css
    JOIN sub_skills ss ON css.sub_skill_id = ss.id
    JOIN domains d ON ss.domain_id = d.id
    JOIN terms t ON css.term_id = t.id
    WHERE css.student_id = $1 AND css.academic_year_id = $2
  `;
  const coScholasticRes = await db.query(coScholasticQuery, [student_id, academic_year_id]);

  // 4. Attendance
  const attendanceQuery = `
    SELECT ar.*, m.month_name
    FROM attendance_records ar
    JOIN months m ON ar.month_id = m.id
    WHERE ar.student_id = $1 AND ar.academic_year_id = $2
    ORDER BY m.display_order ASC
  `;
  const attendanceRes = await db.query(attendanceQuery, [student_id, academic_year_id]);

  // 5. Remarks
  const remarksQuery = `
    SELECT r.*, rt.type_name
    FROM remarks r
    JOIN remark_types rt ON r.remark_type_id = rt.id
    WHERE r.student_id = $1 AND r.academic_year_id = $2
  `;
  const remarksRes = await db.query(remarksQuery, [student_id, academic_year_id]);

  // 6. Class Subjects
  const subjectsQuery = `
        SELECT sub.id, sub.subject_name, cs.max_marks
        FROM class_subjects cs
        JOIN subjects sub ON cs.subject_id = sub.id
        WHERE cs.class_id = $1 AND cs.academic_year_id = $2
        ORDER BY cs.display_order ASC, sub.subject_name ASC
    `;
  // student.class_id is now available from query 1
  const subjectsRes = await db.query(subjectsQuery, [student.class_id, academic_year_id]);

  return {
    student,
    scholastic: scholasticRes.rows,
    co_scholastic: coScholasticRes.rows,
    attendance: attendanceRes.rows,
    remarks: remarksRes.rows,
    subjects: subjectsRes.rows,
    generated_at: new Date().toISOString(),
  };
}
