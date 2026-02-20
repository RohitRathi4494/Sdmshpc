'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRINT_STYLES } from '@/app/lib/print-styles';
import { getTemplateForClass, ReportTemplate } from '@/app/lib/report-mapping';
import ReportTemplate_III_VIII from '@/app/components/reports/ReportTemplate_III_VIII';

// Helper types
interface ReportData {
    student: any;
    scholastic: any[];
    co_scholastic: any[];
    attendance: any[];
    remarks: any[];
    subjects?: any[];
}

export default function ParentReportPage() {
    const router = useRouter();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || undefined;
                if (!token) {
                    console.log("No token, redirecting");
                    router.push('/parent/login');
                    return;
                }

                // 1. Get Student Session
                const studentRes = await fetch('/api/parent/student', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!studentRes.ok) {
                    throw new Error('Failed to fetch student session');
                }

                const studentData = await studentRes.json();
                console.log("Student Data Fetched:", studentData);

                const studentId = studentData?.data?.student?.id;
                const yearId = studentData?.data?.academicYear?.id;

                if (!studentId || !yearId) {
                    throw new Error("Missing student or year data");
                }

                // 2. Fetch Report Data
                const reportRes = await fetch(`/api/reports/student/${studentId}?academic_year_id=${yearId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!reportRes.ok) {
                    const err = await reportRes.json();
                    throw new Error(err.message || 'Failed to fetch report');
                }

                const reportJson = await reportRes.json();
                console.log("Report Data Fetched:", reportJson);

                if (!reportJson.data) {
                    throw new Error("Report data is empty");
                }

                setReportData(reportJson.data);

            } catch (err: any) {
                console.error("Error fetching report:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [router]);


    if (loading) return <div className="p-8 text-center text-gray-500">Loading report card...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!reportData) return <div className="p-8 text-center text-gray-500">No report data found.</div>;



    return (
        <div className="bg-white min-h-screen py-8 px-4 sm:px-8">
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

            <div className="max-w-6xl mx-auto mb-8 bg-white shadow-lg rounded-xl overflow-hidden">
                {/* Back Button */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white no-print">
                    <button
                        onClick={() => router.push('/parent')}
                        className="flex items-center hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="font-semibold">View Only Mode</div>
                </div>

                {/* Report Content Wrapper */}
                <div className="p-8 overflow-x-auto">
                    {(() => {
                        const template = getTemplateForClass(reportData.student?.class_name);

                        if (template === ReportTemplate.III_VIII) {
                            return <ReportTemplate_III_VIII reportData={reportData} />;
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
        </div>
    );
}
