
import puppeteer from 'puppeteer-core';


export async function generatePagePdf(targetUrl: string): Promise<Buffer> {
    let browser;
    try {
        if (process.env.NODE_ENV === 'production') {
            const chromium = require('@sparticuz/chromium');
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            } as any);
        } else {
            const localPuppeteer = require('puppeteer');
            browser = await localPuppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        const page = await browser.newPage();
        console.log(`Generating PDF for URL: ${targetUrl}`);

        await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 60000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error("PDF Engine Error Detail:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

export async function generatePdf(studentId: number, academicYearId: number): Promise<Buffer> {
    const token = process.env.PDF_INTERNAL_TOKEN || 'default_secret';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/print/student/${studentId}?token=${token}&academic_year_id=${academicYearId}`;
    return generatePagePdf(url);
}

