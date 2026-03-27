import { db } from '@/app/lib/db';

/**
 * Checks if a specific assessment component is locked for a given class, term, and academic year.
 * Returns true if locked, false otherwise.
 */
export async function checkAssessmentLock(academicYearId: number, classId: number, termId: number, componentId: number, tenantId: number): Promise<boolean> {
    try {
        const query = `
            SELECT is_locked 
            FROM assessment_locks 
            WHERE academic_year_id = $1 AND class_id = $2 AND term_id = $3 AND component_id = $4 AND tenant_id = $5
        `;
        const { rows } = await db.query(query, [academicYearId, classId, termId, componentId, tenantId]);

        if (rows.length > 0 && rows[0].is_locked) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking assessment lock:", error);
        // Fail-safe: if we can't check the lock, assume it's locked to prevent unauthorized edits during DB issues
        return true;
    }
}

/**
 * Helper to get the student's current class_id for checking locks
 */
export async function getStudentClass(studentId: number, academicYearId: number, tenantId: number): Promise<number | null> {
    try {
        // Try getting class from enrollment first
        const enrollmentQuery = `
            SELECT class_id 
            FROM student_enrollments 
            WHERE student_id = $1 AND academic_year_id = $2 AND tenant_id = $3
        `;
        const enumRows = await db.query(enrollmentQuery, [studentId, academicYearId, tenantId]);
        if (enumRows.rows.length > 0) {
            return enumRows.rows[0].class_id;
        }

        // Fallback to student's default class
        const studentQuery = `SELECT class_id FROM students WHERE id = $1 AND tenant_id = $2`;
        const stdRows = await db.query(studentQuery, [studentId, tenantId]);
        if (stdRows.rows.length > 0) {
            return stdRows.rows[0].class_id;
        }

        return null; // Student not found
    } catch (error) {
        console.error("Error fetching student class:", error);
        return null;
    }
}
