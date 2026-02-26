
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import { PRINT_STYLES } from '@/app/lib/print-styles';
import { getTemplateForClass, ReportTemplate } from '@/app/lib/report-mapping';
import ReportTemplate_III_VIII from '@/app/components/reports/ReportTemplate_III_VIII';
import { FoundationalReportContent } from '@/app/print/foundational/[studentId]/page';

export default function ReportPreviewPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const [reportData, setReportData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || undefined;
                const report = await ApiClient.get<any>(`/reports/student/${studentId}?academic_year_id=1`, token);
                setReportData(report);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    const handleGeneratePDF = async () => {
        setGenerating(true);
        try {
            const template = getTemplateForClass(reportData?.student?.class_name);
            if (template === ReportTemplate.NURSERY || template === ReportTemplate.LKG_UKG || template === ReportTemplate.I_II) {
                // Foundational uses purely native browser CSS printing 
                const oldTitle = document.title;
                const filename = `${reportData.student.student_name}_${reportData.student.class_name}_${reportData.student.section_name}`.replace(/[^a-zA-Z0-9._-]/g, '_');
                document.title = filename;
                window.print();
                document.title = oldTitle;
                return;
            }

            const token = sessionStorage.getItem('hpc_token') || undefined;
            const response = await fetch(`/api/reports/student/${studentId}/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ academic_year_id: 1 })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'PDF generation failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = `${reportData.student.student_name}_${reportData.student.class_name}_${reportData.student.section_name}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (e: any) {
            console.error(e);
            alert(`Failed to generate PDF: ${e.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const router = useRouter();

    if (loading) return <div className="p-8 text-center">Loading preview...</div>;
    if (!reportData) return <div className="p-8 text-center text-red-500">Failed to load report data. Please check the console for details.</div>;



    return (
        <div className="bg-white min-h-screen p-8">
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

            <div className="max-w-6xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors no-print"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
                <div className="flex justify-between items-center no-print">
                    <h1 className="text-2xl font-bold text-gray-800">Report Preview</h1>
                    <button
                        onClick={handleGeneratePDF}
                        disabled={generating}
                        className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                        {generating ? 'Downloading PDF...' : 'Download PDF'}
                    </button>
                </div>

                {(() => {
                    const template = getTemplateForClass(reportData.student?.class_name);

                    if (template === ReportTemplate.III_VIII) {
                        return <ReportTemplate_III_VIII reportData={reportData} />;
                    } else if (template === ReportTemplate.NURSERY || template === ReportTemplate.LKG_UKG || template === ReportTemplate.I_II) {
                        return (
                            <div className="bg-transparent" style={{ marginLeft: '-16px', marginRight: '-16px' }}>
                                <FoundationalReportContent autoPrint={false} />
                            </div>
                        );
                    } else {
                        return (
                            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
                                <h2 className="text-xl font-semibold text-gray-600">Report Card Template Coming Soon</h2>
                                <p className="text-gray-500 mt-2">The design for Class {reportData.student?.class_name} is under development.</p>
                            </div>
                        );
                    }
                })()}
            </div>
        </div>
    );
}
