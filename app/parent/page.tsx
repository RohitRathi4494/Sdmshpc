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

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const token = localStorage.getItem('hpc_parent_token');
                if (!token) {
                    router.push('/parent/login');
                    return;
                }

                const res = await fetch('/api/parent/student', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    localStorage.removeItem('hpc_parent_token');
                    router.push('/parent/login');
                    return;
                }

                const data = await res.json();
                if (!data.success) throw new Error(data.message);

                setStudent(data.data.student);
                setYear(data.data.academicYear);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [router]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your child's profile...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Hello, Parent!</h2>
                    <p className="text-gray-500">Here is the update for academic year <span className="font-semibold text-blue-600">{year?.year_name}</span></p>
                </div>
                <div className="hidden md:block text-4xl">👋</div>
            </div>

            {/* Student Card */}
            {student && (
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Profile Section */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <div className="px-6 pb-6 relative">
                            <div className="w-20 h-20 bg-white rounded-full border-4 border-white absolute -top-10 flex items-center justify-center text-3xl shadow-md">
                                🎓
                            </div>
                            <div className="pt-12">
                                <h3 className="text-xl font-bold text-gray-800">{student.student_name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{student.admission_no}</p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Class</span>
                                        <span className="font-medium text-gray-800">{student.class_name || 'N/A'} - {student.section_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Roll No</span>
                                        <span className="font-medium text-gray-800">{student.roll_no || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-gray-500">DOB</span>
                                        <span className="font-medium text-gray-800">{new Date(student.dob).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Report Card Action */}
                        <div onClick={() => router.push('/parent/report')} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group group-hover:border-blue-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl mb-4 group-hover:scale-110 transition-transform">
                                📄
                            </div>
                            <h4 className="font-bold text-gray-800 mb-1">View Report Card</h4>
                            <p className="text-sm text-gray-500">Check the Holistic Progress Card for the current term.</p>
                        </div>

                        {/* Fee Status (Mock) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border opacity-75 cursor-not-allowed">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-2xl mb-4">
                                💳
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-1">Fee Status</h4>
                                    <p className="text-sm text-gray-500">No dues pending.</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">PAID</span>
                            </div>
                        </div>

                        {/* Messages (Mock) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border sm:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 text-xl">
                                    📢
                                </div>
                                <h4 className="font-bold text-gray-800">Recent Notices</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                                    <p className="text-sm font-semibold text-gray-800">Parent-Teacher Meeting</p>
                                    <p className="text-xs text-gray-500">Scheduled for next Saturday at 10:00 AM.</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border-l-4 border-purple-400">
                                    <p className="text-sm font-semibold text-gray-800">Annual Sports Day</p>
                                    <p className="text-xs text-gray-500">Participation forms are due by Friday.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
