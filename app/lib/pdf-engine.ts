
import puppeteer from 'puppeteer-core';

export async function generatePdf(studentId: number, academicYearId: number): Promise<Buffer> {
    let browser;
    try {
        if (process.env.NODE_ENV === 'production') {
            const chromium = require('@sparticuz/chromium');

            // Optional: Load custom fonts if needed
            // await chromium.font('https://raw.githack.com/googlefonts/noto-emoji/main/fonts/NotoColorEmoji.ttf');

            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            } as any);
        } else {
            // Local Development
            const localPuppeteer = require('puppeteer');
            browser = await localPuppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        const page = await browser.newPage();

        // Pass Internal Token
        const token = process.env.PDF_INTERNAL_TOKEN || 'default_secret'; // Fallback for safety

        // BETTER logic for Base URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const url = `${baseUrl}/print/student/${studentId}?token=${token}&academic_year_id=${academicYearId}`;

        console.log(`Generating PDF for URL: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // Increased timeout

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
    } catch (error) {
        console.error("PDF Engine Error Detail:", error);
        if (error instanceof Error) {
            console.error("Message:", error.message);
            console.error("Stack:", error.stack);
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
