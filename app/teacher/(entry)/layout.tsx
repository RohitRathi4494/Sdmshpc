'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

interface StudentInfo {
    id: number;
    student_name: string;
    class_name: string;
    section_name: string;
    admission_no: string;
    roll_no: number;
}

export default function StudentEntryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Extract student ID from URL: /teacher/scholastic/student/123 -> 123
    const match = pathname.match(/\/student\/(\d+)/);
    const studentId = match ? match[1] : null;

    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const fetchStudent = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                // The report endpoint reliably returns the student metadata
                const data = await ApiClient.get<any>(`/reports/student/${studentId}?academic_year_id=1`, token);
                if (data && data.student) {
                    setStudent(data.student);
                }
            } catch (error) {
                console.error("Failed to fetch student details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [studentId]);

    if (!studentId) {
        return <div className="p-8 text-center text-red-500">Error: No student ID found in URL.</div>;
    }

    const tabs = [
        { name: 'Scholastic', path: `/teacher/scholastic/student/${studentId}` },
        { name: 'Co-Scholastic', path: `/teacher/co-scholastic/student/${studentId}` },
        { name: 'Attendance', path: `/teacher/attendance/student/${studentId}` },
        { name: 'Remarks', path: `/teacher/remarks/student/${studentId}` },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-16">
            {/* Common Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/teacher/students')}
                        className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 transition-colors"
                    >
                        ← Back to Class
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Holistic Progress Card Entry
                        </h1>
                        <div className="text-sm text-gray-500 mt-0.5">
                            {loading ? (
                                <span className="animate-pulse bg-gray-200 h-4 w-48 block rounded"></span>
                            ) : student ? (
                                <span>
                                    <strong className="text-gray-700">{student.student_name}</strong> • {student.class_name}-{student.section_name} • Roll: {student.roll_no || '-'}
                                </span>
                            ) : (
                                <span>Student not found</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/teacher/preview/student/${studentId}`)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview Card
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-t-xl border-b border-gray-200 shadow-sm overflow-hidden flex overflow-x-auto custom-scrollbar">
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.path.split(`/student/${studentId}`)[0]);
                    return (
                        <Link
                            key={tab.name}
                            href={tab.path}
                            className={`flex-1 min-w-[140px] text-center py-3.5 text-sm font-medium transition-colors relative ${isActive
                                ? 'text-indigo-600 bg-indigo-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.name}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Main Content Area */}
            <div className="bg-white p-6 shadow-sm rounded-b-xl border border-t-0 border-gray-100 min-h-[400px]">
                {children}
            </div>
        </div>
    );
}
