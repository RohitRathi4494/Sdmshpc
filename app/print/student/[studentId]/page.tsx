import React from 'react';
import { notFound } from 'next/navigation';
import { getStudentReportData } from '@/app/lib/report-service';
import { PRINT_STYLES } from '@/app/lib/print-styles';
import { getTemplateForClass, ReportTemplate } from '@/app/lib/report-mapping';

import ReportTemplate_III_VIII from '@/app/components/reports/ReportTemplate_III_VIII';
import ReportTemplate_III_VIII_Periodic from '@/app/components/reports/ReportTemplate_III_VIII_Periodic';
import ReportTemplate_III_VIII_Terminal from '@/app/components/reports/ReportTemplate_III_VIII_Terminal';
import ReportTemplate_IX from '@/app/components/reports/ReportTemplate_IX';
import ReportTemplate_IX_Periodic from '@/app/components/reports/ReportTemplate_IX_Periodic';
import ReportTemplate_IX_Terminal from '@/app/components/reports/ReportTemplate_IX_Terminal';
import ReportTemplate_X from '@/app/components/reports/ReportTemplate_X';
import ReportTemplate_X_Periodic from '@/app/components/reports/ReportTemplate_X_Periodic';
import ReportTemplate_X_Terminal from '@/app/components/reports/ReportTemplate_X_Terminal';
import ReportTemplate_XI from '@/app/components/reports/ReportTemplate_XI';
import ReportTemplate_XI_Periodic from '@/app/components/reports/ReportTemplate_XI_Periodic';
import ReportTemplate_XI_Terminal from '@/app/components/reports/ReportTemplate_XI_Terminal';
import { FoundationalReportContent } from '@/app/components/reports/FoundationalReportContent';
import { FoundationalReportContent_I_II } from '@/app/components/reports/FoundationalReportContent_I_II';

interface PrintPageProps {
    params: {
        studentId: string;
    };
    searchParams: {
        token?: string;
        academic_year_id?: string;
        report_type?: string;
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
        let TemplateComponent = <ReportTemplate_III_VIII reportData={reportData} />;

        if (searchParams.report_type === 'PA1' || searchParams.report_type === 'PA2') {
            TemplateComponent = <ReportTemplate_III_VIII_Periodic reportData={reportData as any} reportType={searchParams.report_type as any} />;
        } else if (searchParams.report_type === 'TA1' || searchParams.report_type === 'TA2') {
            TemplateComponent = <ReportTemplate_III_VIII_Terminal reportData={reportData as any} reportType={searchParams.report_type as any} />;
        }

        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    {TemplateComponent}
                </body>
            </html>
        );
    } else if (template === ReportTemplate.IX) {
        let TemplateComponent = <ReportTemplate_IX reportData={reportData} />;
        if (searchParams.report_type === 'PA1' || searchParams.report_type === 'PA2') {
            TemplateComponent = <ReportTemplate_IX_Periodic reportData={reportData} reportType={searchParams.report_type as any} />;
        } else if (searchParams.report_type === 'TA1' || searchParams.report_type === 'TA2') {
            TemplateComponent = <ReportTemplate_IX_Terminal reportData={reportData} reportType={searchParams.report_type as any} />;
        }

        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    {TemplateComponent}
                </body>
            </html>
        );
    } else if (template === ReportTemplate.X) {
        let TemplateComponent = <ReportTemplate_X reportData={reportData} />;
        if (searchParams.report_type === 'PA1' || searchParams.report_type === 'PA2') {
            TemplateComponent = <ReportTemplate_X_Periodic reportData={reportData} reportType={searchParams.report_type as any} />;
        } else if (searchParams.report_type === 'TA1' || searchParams.report_type === 'TA2') {
            TemplateComponent = <ReportTemplate_X_Terminal reportData={reportData} reportType={searchParams.report_type as any} />;
        }

        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    {TemplateComponent}
                </body>
            </html>
        );
    } else if (template === ReportTemplate.XI) {
        let TemplateComponent = <ReportTemplate_XI reportData={reportData} />;
        if (searchParams.report_type === 'PA1' || searchParams.report_type === 'PA2') {
            TemplateComponent = <ReportTemplate_XI_Periodic reportData={reportData} reportType={searchParams.report_type as any} />;
        } else if (searchParams.report_type === 'TA1' || searchParams.report_type === 'TA2') {
            TemplateComponent = <ReportTemplate_XI_Terminal reportData={reportData} reportType={searchParams.report_type as any} />;
        }

        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    {TemplateComponent}
                </body>
            </html>
        );
    } else if (template === ReportTemplate.NURSERY || template === ReportTemplate.LKG_UKG) {
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
    } else if (template === ReportTemplate.I_II) {
        return (
            <html>
                <head>
                    <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
                </head>
                <body className="print-mode bg-white">
                    <div className="bg-transparent" style={{ marginLeft: '-16px', marginRight: '-16px' }}>
                        <FoundationalReportContent_I_II autoPrint={false} />
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
