'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '@/app/lib/api-client';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem('hpc_token') || '';
                const data = await ApiClient.get<any[]>('/teacher/classes', token);
                setClasses(data);
            } catch (error) {
                console.error('Failed to load classes', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    const handleDownload = async (url: string, filename: string) => {
        try {
            const token = localStorage.getItem('hpc_token');
            if (!token) {
                alert('Please login again');
                return;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Download failed');
                return;
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download report');
        }
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Classes</h2>

            {classes.length === 0 ? (
                <div className="p-8 bg-white rounded-lg shadow text-center text-gray-500">
                    No classes assigned or found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border-t-4 border-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800">{cls.class_name}</h3>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                    {cls.sections?.length || 0} Sections
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Enter Marks:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => router.push(`/teacher/students?class_id=${cls.id}`)}
                                            className="col-span-2 text-center text-sm border border-blue-200 text-blue-600 py-1.5 rounded hover:bg-blue-50 transition"
                                        >
                                            All Students
                                        </button>
                                        {cls.sections?.map((sec: any) => (
                                            <button
                                                key={sec.id}
                                                onClick={() => router.push(`/teacher/students?class_id=${cls.id}&section_id=${sec.id}`)}
                                                className="text-sm bg-gray-50 text-gray-700 py-1.5 rounded hover:bg-blue-600 hover:text-white transition"
                                            >
                                                {sec.section_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-gray-500 text-sm mb-2 font-medium">Cumulative Reports (Excel)</p>
                                    {cls.sections?.map((sec: any) => (
                                        <div key={sec.id} className="flex flex-col gap-2 mb-2 p-2 bg-gray-50 rounded">
                                            <span className="text-xs text-gray-500 font-semibold">{sec.section_name} Section</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleDownload(`/api/reports/cumulative/scholastic?class_id=${cls.id}&section_id=${sec.id}`, `scholastic_${cls.class_name}_${sec.section_name}.xlsx`)}
                                                    className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded hover:bg-green-700 transition"
                                                >
                                                    Scholastic
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(`/api/reports/cumulative/co-scholastic?class_id=${cls.id}&section_id=${sec.id}`, `co_scholastic_${cls.class_name}_${sec.section_name}.xlsx`)}
                                                    className="flex-1 text-xs bg-teal-600 text-white py-1.5 rounded hover:bg-teal-700 transition"
                                                >
                                                    Co-Scholastic
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
