
import { NextResponse } from 'next/server';
import { generatePagePdf } from '@/app/lib/pdf-engine';
import { verifyAuth, UserRole, extractToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(request.url);

        // Accept token from Authorization header OR from URL query param
        // (window.open() cannot set headers, so we allow ?token=... for browser navigation)
        const headerToken = extractToken(request.headers.get('Authorization'));
        const queryToken = searchParams.get('token') || undefined;
        const token = headerToken || queryToken;

        const user = await verifyAuth(token);

        if (!user || (user.role !== UserRole.OFFICE && user.role !== UserRole.ADMIN)) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const receiptId = params.id;
        const internalToken = process.env.PDF_INTERNAL_TOKEN || 'default_secret';
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const receiptUrl = `${baseUrl}/print/receipt/${receiptId}?token=${internalToken}`;

        const pdfBuffer = await generatePagePdf(receiptUrl);

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="receipt-${receiptId}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("Receipt PDF Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
