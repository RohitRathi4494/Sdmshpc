'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StudentData {
    id: number;
    student_name: string;
    admission_no: string;
    class_name?: string;
    section_name?: string;
    roll_no?: number;
    dob: string;
}

interface AcademicYear {
    id: number;
    year_name: string;
}

export default function ParentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [year, setYear] = useState<AcademicYear | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [notices, setNotices] = useState<any[]>([]);
    const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
    const [showAllNotices, setShowAllNotices] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                if (!token) {
                    router.push('/parent/login');
                    return;
                }

                // Fetch Student Data
                const studentRes = await fetch('/api/parent/student', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (studentRes.ok) {
                    const data = await studentRes.json();
                    setStudent(data.data.student);
                    setYear(data.data.academicYear);
                } else if (studentRes.status === 401) {
                    sessionStorage.removeItem('hpc_token');
                    router.push('/parent/login');
                    return;
                } else {
                    const errorData = await studentRes.json();
                    throw new Error(errorData.message || 'Failed to fetch student data');
                }

                // Fetch Notices
                const noticesRes = await fetch('/api/parent/notices', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (noticesRes.ok) {
                    const noticeData = await noticesRes.json();
                    setNotices(noticeData.data || []);
                } else if (noticesRes.status === 401) {
                    sessionStorage.removeItem('hpc_token');
                    router.push('/parent/login');
                    return;
                } else {
                    // Log error but don't block dashboard if notices fail
                    console.error("Failed to fetch notices:", noticesRes.status, await noticesRes.text());
                }

            } catch (err: any) {
                setError(err.message);
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleViewReport = () => {
        router.push('/parent/report');
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!student) return null; // Should ideally not happen if error is handled, but as a fallback

    return (
        <>
            <div className="p-6 max-w-6xl mx-auto space-y-6">

                {/* Student Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                                {student.student_name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{student.student_name}</h1>
                                <p className="opacity-90">Class {student.class_name} - {student.section_name} | Roll No: {student.roll_no}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <span className="block text-gray-500 mb-1">Admission No</span>
                            <span className="font-semibold text-gray-800">{student.admission_no}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 mb-1">Date of Birth</span>
                            <span className="font-semibold text-gray-800">{new Date(student.dob).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 mb-1">Academic Year</span>
                            <span className="font-semibold text-gray-800 text-blue-600 px-2 py-1 bg-blue-50 rounded-md inline-block">
                                {year?.year_name || 'Current'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Actions Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div onClick={handleViewReport} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">Action</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">View Report Card</h3>
                            <p className="text-gray-500 text-sm">Access the latest Holistic Progress Card (HPC)</p>
                        </div>

                        {/* 
                    <div onClick={() => router.push('/parent/fees')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">View</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Fee Status</h3>
                        <p className="text-gray-500 text-sm">Check pending dues and payment history</p>
                    </div>
                    */}
                    </div>

                    {/* Notices Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Recent Notices</h2>
                        </div>

                        <div className="space-y-4">
                            {notices.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No new notices.</div>
                            ) : (
                                notices.slice(0, 3).map((notice, idx) => (
                                    <div key={notice.id} onClick={() => setSelectedNotice(notice)} className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition ${idx % 2 === 0 ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-800">{notice.title}</h3>
                                            <span className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                                        <div className="mt-2 text-xs text-gray-500 text-right font-medium">
                                            From: {notice.sender_name || 'School Admin'}
                                        </div>
                                    </div>
                                ))
                            )}

                            {notices.length > 3 && (
                                <button onClick={() => setShowAllNotices(true)} className="w-full text-center text-blue-600 text-sm hover:underline mt-2">
                                    View All Notices
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: All Notices */}
            {
                showAllNotices && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 pb-20 sm:p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                            <div className="flex justify-between items-center p-5 border-b">
                                <h2 className="text-xl font-bold text-gray-800">All Notices</h2>
                                <button onClick={() => setShowAllNotices(false)} className="text-gray-500 hover:text-gray-800">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-5 overflow-y-auto space-y-4">
                                {notices.map((notice, idx) => (
                                    <div key={notice.id} onClick={() => setSelectedNotice(notice)} className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition ${idx % 2 === 0 ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-gray-800">{notice.title}</h3>
                                            <span className="text-xs text-gray-500">{new Date(notice.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                                        <div className="mt-2 text-xs text-gray-500 text-right font-medium">
                                            From: {notice.sender_name || 'School Admin'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Notice Details */}
            {
                selectedNotice && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex justify-between items-start shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold pr-4">{selectedNotice.title}</h2>
                                    <p className="text-sm opacity-90 mt-1">{new Date(selectedNotice.created_at).toLocaleDateString()} • From: {selectedNotice.sender_name || 'School Admin'}</p>
                                </div>
                                <button onClick={() => setSelectedNotice(null)} className="text-white hover:opacity-80 shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedNotice.content}</p>
                            </div>
                            <div className="bg-gray-50 p-4 flex justify-end shrink-0 border-t border-gray-100">
                                <button onClick={() => setSelectedNotice(null)} className="px-5 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
