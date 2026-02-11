import { NextResponse } from 'next/server';
import { verifyAuth, extractToken, UserRole } from '@/app/lib/auth'; // Everyone can view reports? Or valid roles.
import { getStudentReportData } from '@/app/lib/report-service';

export async function GET(request: Request, context: { params: Promise<{ student_id: string }> }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }
        // Access control: Admin, Teacher, or the specific student (if View Only user matches student_id? tricky without users table mapping).
        // For now, allow authorized roles.

        const { searchParams } = new URL(request.url);
        const academic_year_id = searchParams.get('academic_year_id');

        if (!academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing academic_year_id' },
                { status: 400 }
            );
        }

        // Await params correctly in Next.js 15+ / App Router
        const params = await context.params;
        const student_id = parseInt(params.student_id, 10);

        if (isNaN(student_id)) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const reportData = await getStudentReportData(student_id, parseInt(academic_year_id, 10));

        if (!reportData) {
            return NextResponse.json(
                { success: false, error_code: 'NOT_FOUND', message: 'Student or enrollment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: reportData,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
