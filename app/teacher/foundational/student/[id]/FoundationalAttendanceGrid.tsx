import React, { useState, useEffect } from 'react';
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

export function FoundationalAttendanceGrid({ studentId, academicYearId }: { studentId: string, academicYearId: string }) {
    const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token');
                const reportUrl = `/reports/foundational/${studentId}?academic_year_id=${academicYearId}`;
                const report = await (ApiClient as any).get(reportUrl, token);

                if (report && report.attendance) {
                    const attMap: Record<number, AttendanceRecord> = {};
                    report.attendance.forEach((a: any) => {
                        const mStr = a.month;
                        const mObj = MONTHS.find(m => m.name === mStr);
                        if (mObj) {
                            attMap[mObj.id] = { month_id: mObj.id, month_name: mStr, working_days: a.total, days_present: a.present };
                        }
                    });
                    setAttendance(attMap);
                }
            } catch (error) {
                console.error("Failed to load attendance", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId, academicYearId]);

    const handleChange = async (monthId: number, field: 'working_days' | 'days_present', value: number) => {
        const current = attendance[monthId] || { month_id: monthId, working_days: 0, days_present: 0 };
        const updated = { ...current, [field]: value };
        setAttendance(prev => ({ ...prev, [monthId]: updated }));

        try {
            setSaving(true);
            const token = sessionStorage.getItem('hpc_token');
            await (ApiClient as any).post('/teacher/attendance', {
                student_id: parseInt(studentId),
                month_id: monthId,
                working_days: updated.working_days,
                days_present: updated.days_present,
                academic_year_id: parseInt(academicYearId)
            }, token);
        } catch (e) {
            console.error("Save failed", e);
            // Revert state on error
            setAttendance(attendance);
            // Optionally, show a user-friendly error message
            alert("Failed to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-sm text-gray-500">Loading attendance data...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
            <div className="bg-[#1B3D6F] text-white px-5 py-3 flex justify-between items-center">
                <div>
                    <div className="font-bold text-sm">Monthly Attendance Record</div>
                    <div className="text-xs opacity-70 mt-0.5">Enter Working Days and Present Days per month</div>
                </div>
                {saving && <span className="text-amber-300 text-xs animate-pulse">Saving...</span>}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Working Days</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Present Days</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {MONTHS.map(month => {
                            const rec = attendance[month.id] || { working_days: 0, days_present: 0 };
                            return (
                                <tr key={month.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-700">{month.name}</td>
                                    <td className="px-4 py-2 text-center">
                                        <input
                                            type="number"
                                            className="w-20 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-400 outline-none transition"
                                            value={rec.working_days || ''}
                                            onChange={(e) => handleChange(month.id, 'working_days', parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <input
                                            type="number"
                                            className="w-20 text-center border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-indigo-400 outline-none transition"
                                            value={rec.days_present || ''}
                                            onChange={(e) => handleChange(month.id, 'days_present', parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
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
