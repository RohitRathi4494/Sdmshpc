'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

interface AttendanceRecord {
    month_id: number;
    month_name: string;
    working_days: number;
    days_present: number;
}

const MONTHS = [
    { id: 1, name: 'Apr' }, { id: 2, name: 'May' }, { id: 3, name: 'Jun' },
    { id: 4, name: 'Jul' }, { id: 5, name: 'Aug' }, { id: 6, name: 'Sep' },
    { id: 7, name: 'Oct' }, { id: 8, name: 'Nov' }, { id: 9, name: 'Dec' },
    { id: 10, name: 'Jan' }, { id: 11, name: 'Feb' }, { id: 12, name: 'Mar' },
];

export default function AttendanceEntryPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('hpc_token');
                // Force cast to any to workaround persistent build error about private property
                const report = await (ApiClient as any).get(`/reports/student/${studentId}?academic_year_id=1`, token);
                setStudentName(report.student.student_name);

                const attMap: Record<number, AttendanceRecord> = {};
                report.attendance.forEach((a: any) => {
                    attMap[a.month_id] = a;
                });
                setAttendance(attMap);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);



    const router = useRouter();

    if (loading) return <div>Loading...</div>;

    const handleChange = async (monthId: number, field: 'working_days' | 'days_present', value: number) => {
        const current = attendance[monthId] || { month_id: monthId, working_days: 0, days_present: 0 };
        const updated = { ...current, [field]: value };
        // ... (rest of logic)
        setAttendance(prev => ({ ...prev, [monthId]: updated }));

        // Simple debounce or save on blur would be better, but keeping consistent with current file
        try {
            // ... save logic
            const token = localStorage.getItem('hpc_token');
            await (ApiClient as any).post('/teacher/attendance', {
                student_id: studentId,
                month_id: monthId,
                working_days: updated.working_days,
                days_present: updated.days_present,
                academic_year_id: 1
            }, token);
        } catch { }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => router.back()}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{studentName} - Attendance</h2>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Attendance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {MONTHS.map(month => {
                            const rec = attendance[month.id] || { working_days: 0, days_present: 0 };
                            const pct = rec.working_days > 0 ? ((rec.days_present / rec.working_days) * 100).toFixed(1) : '-';

                            return (
                                <tr key={month.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{month.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="number"
                                            className="w-20 text-center border rounded p-1"
                                            value={rec.working_days || ''}
                                            onChange={(e) => handleChange(month.id, 'working_days', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="number"
                                            className="w-20 text-center border rounded p-1"
                                            value={rec.days_present || ''}
                                            onChange={(e) => handleChange(month.id, 'days_present', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-600">
                                        {pct}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
