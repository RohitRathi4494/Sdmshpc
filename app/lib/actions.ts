'use server';

import { db } from './db';

export async function getActiveAcademicYear() {
    try {
        const result = await db.query(
            'SELECT year_name FROM academic_years WHERE is_active = true LIMIT 1'
        );

        if (result.rows.length > 0) {
            return result.rows[0].year_name;
        }
        return '2024-2025'; // Fallback
    } catch (error) {
        console.error('Error fetching active academic year:', error);
        return '2024-2025'; // Fallback on error
    }
}
