import { NextResponse } from 'next/server';
import { verifyAuth, extractToken } from '@/app/lib/auth';
import { generatePdf } from '@/app/lib/pdf-engine';

export async function POST(request: Request, context: { params: Promise<{ student_id: string }> }) {
    try {
        const token = extractToken(request.headers.get('Authorization'));
        const user = await verifyAuth(token);

        if (!user) {
            return NextResponse.json(
                { success: false, error_code: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        let academic_year_id;
        try {
            const body = await request.json();
            academic_year_id = body.academic_year_id;
        } catch (e) {
            // Body might be empty
        }

        if (!academic_year_id) {
            const { searchParams } = new URL(request.url);
            academic_year_id = searchParams.get('academic_year_id');
        }

        if (!academic_year_id) {
            return NextResponse.json(
                { success: false, error_code: 'VALIDATION_ERROR', message: 'Missing academic_year_id' },
                { status: 400 }
            );
        }

        const params = await context.params;
        const student_id = parseInt(params.student_id, 10);

        // Generate PDF
        const pdfBuffer = await generatePdf(student_id, Number(academic_year_id));

        // Return PDF Stream
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Report_Card_${student_id}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { success: false, error_code: 'INTERNAL_ERROR', message: error.message },
            { status: 500 }
        );
    }
}
