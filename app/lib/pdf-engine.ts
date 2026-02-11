
import puppeteer from 'puppeteer';

export async function generatePdf(studentId: number, academicYearId: number): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Pass Internal Token
        const token = process.env.PDF_INTERNAL_TOKEN;
        const baseUrl = 'http://localhost:3000'; // Ensure this matches your running server
        const url = `${baseUrl}/print/student/${studentId}?token=${token}&academic_year_id=${academicYearId}`;

        await page.goto(url, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}
