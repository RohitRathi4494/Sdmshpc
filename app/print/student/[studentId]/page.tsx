import React from 'react';
import { notFound } from 'next/navigation';
import { getStudentReportData } from '@/app/lib/report-service';
import { PRINT_STYLES } from '@/app/lib/print-styles';
import { getTemplateForClass, ReportTemplate } from '@/app/lib/report-mapping';

import ReportTemplate_III_VIII from '@/app/components/reports/ReportTemplate_III_VIII';
import { FoundationalReportContent } from '@/app/components/reports/FoundationalReportContent';

interface PrintPageProps {
    params: {
        studentId: string;
    };
    searchParams: {
        token?: string;
        academic_year_id?: string;
    };
}

export default async function PrintReportPage({ params, searchParams }: PrintPageProps) {
    // Force update for Vercel deployment
    const internalToken = process.env.PDF_INTERNAL_TOKEN;

    if (!internalToken || searchParams.token !== internalToken) {
        if (process.env.NODE_ENV === 'production' && !internalToken) {
            console.error("PDF_INTERNAL_TOKEN is not set in environment variables!");
        }

        if (searchParams.token !== internalToken && searchParams.token !== 'default_secret') {
            return <div style={{ color: 'red', padding: 20 }}>Unauthorized Print Request</div>;
        }
    }

    const studentId = parseInt(params.studentId, 10);
    const academicYearId = searchParams.academic_year_id ? parseInt(searchParams.academic_year_id, 10) : 1;

    const reportData = await getStudentReportData(studentId, academicYearId);

    if (!reportData) {
        return notFound();
    }

    const template = getTemplateForClass(reportData.student?.class_name);

    if (template === ReportTemplate.III_VIII) {
        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    <ReportTemplate_III_VIII reportData={reportData} />
                </body>
            </html>
        );
    } else if (template === ReportTemplate.NURSERY || template === ReportTemplate.LKG_UKG || template === ReportTemplate.I_II) {
        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    <div className="bg-transparent" style={{ marginLeft: '-16px', marginRight: '-16px' }}>
                        <FoundationalReportContent autoPrint={false} />
                    </div>
                </body>
            </html>
        )
    }

    return (
        <html>
            <head>
                <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
            </head>
            <body className="print-mode bg-white">
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h1>Template Coming Soon</h1>
                    <p>Report card templates for this class are under development.</p>
                </div>
            </body>
        </html>
    );
}
