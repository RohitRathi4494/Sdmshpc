'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

interface ClassData {
    id: number;
    class_name: string;
    sections: {
        id: number;
        section_name: string;
    }[];
}

interface TermData {
    id: number;
    term_name: string;
}

export default function AnalyticsDashboard() {
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [loadingData, setLoadingData] = useState(false);

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [terms, setTerms] = useState<TermData[]>([]);
    const [yearData, setYearData] = useState<{ id: string; name: string } | null>(null);

    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');

    // Analytics State
    const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [perfectAttendance, setPerfectAttendance] = useState<any[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || undefined;

                const [yearsData, classData, termData] = await Promise.all([
                    ApiClient.get<any[]>('/admin/academic-years', token).catch(() => []),
                    ApiClient.get<ClassData[]>('/teacher/classes', token), // Borrowing teacher API which returns structural data or we can assume admin has access
                    ApiClient.get<TermData[]>('/admin/terms', token).catch(() => [{ id: 1, term_name: 'Term I' }, { id: 2, term_name: 'Term II' }]) // Fallback if API doesn't exist yet
                ]);

                const activeYear = yearsData?.find((y: any) => y.is_active) || yearsData?.[0];

                if (activeYear && activeYear.id) {
                    setYearData({ id: activeYear.id.toString(), name: activeYear.year_name || 'Current Year' });
                }
                setClasses(classData);
                setTerms(termData);

                if (classData.length > 0) {
                    setSelectedClass(classData[0].id.toString());
                }

            } catch (err) {
                console.error("Failed to load filters", err);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!yearData || !yearData.id || !selectedClass) return;

            setLoadingData(true);
            try {
                const token = sessionStorage.getItem('hpc_token') || undefined;

                let baseQuery = `?academic_year_id=${yearData.id}&class_id=${selectedClass}`;
                if (selectedSection) baseQuery += `&section_id=${selectedSection}`;
                if (selectedTerm) baseQuery += `&term=${encodeURIComponent(selectedTerm)}`;

                const [subjects, students, attendance, trend] = await Promise.all([
                    ApiClient.get<any[]>(`/admin/analytics/subject-performance${baseQuery}`, token),
                    ApiClient.get<any[]>(`/admin/analytics/top-students${baseQuery}`, token),
                    ApiClient.get<any[]>(`/admin/analytics/perfect-attendance${baseQuery}`, token),
                    ApiClient.get<any[]>(`/admin/analytics/attendance-trend${baseQuery}`, token),
                ]);

                setSubjectPerformance(subjects || []);
                setTopStudents(students || []);
                setPerfectAttendance(attendance || []);
                setAttendanceTrend(trend || []);

            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchAnalytics();
    }, [yearData, selectedClass, selectedSection, selectedTerm]);

    const activeClassData = classes.find(c => c.id.toString() === selectedClass);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-4">Academic Analytics Dashboard</h1>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                {loadingFilters ? (
                    <div className="text-sm text-gray-500 py-2">Loading context...</div>
                ) : (
                    <>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Academic Year</label>
                            <select
                                value={yearData?.id || ''}
                                onChange={() => { }} // Disabled so no handler needed
                                className="block w-full border border-gray-300 rounded-md p-2 bg-gray-50 focus:outline-none"
                                disabled // Keep fixed to active year for now, can be unlocked if history is needed
                            >
                                <option value={yearData?.id || ''}>{yearData?.name || 'Loading...'}</option>
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection(''); // Reset Section
                                }}
                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Sections</option>
                                {activeClassData?.sections?.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.section_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Term</label>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Cumulative (Both Terms)</option>
                                {terms.map((t: any) => <option key={t.id} value={t.term_name}>{t.term_name}</option>)}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {loadingData && (
                <div className="text-center py-10">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading"></div>
                    <p className="text-gray-500 mt-2">Crunching numbers...</p>
                </div>
            )}

            {!loadingData && (
                <>
                    {/* WIDGETS ROW 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Subject Performance */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Subject Performance (Percentage)</h2>
                            {subjectPerformance.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={subjectPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed">No scores recorded yet.</div>
                            )}
                        </div>

                        {/* Top Students */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                👑 Top 10 Students Leaderboard
                            </h2>
                            {topStudents.length > 0 ? (
                                <div className="overflow-auto flex-1">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="py-2 px-4 text-left font-semibold text-gray-600">Rank</th>
                                                <th className="py-2 px-4 text-left font-semibold text-gray-600">Student Name</th>
                                                <th className="py-2 px-4 text-right font-semibold text-gray-600">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topStudents.map((s, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        {s.rank === 1 && <span className="text-yellow-500 font-bold text-lg">🥇 1</span>}
                                                        {s.rank === 2 && <span className="text-gray-400 font-bold text-lg">🥈 2</span>}
                                                        {s.rank === 3 && <span className="text-amber-600 font-bold text-lg">🥉 3</span>}
                                                        {s.rank > 3 && <span className="text-gray-500 font-medium pl-2">{s.rank}</span>}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-gray-900">{s.student}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-blue-600">{s.score}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed text-sm">No scores recorded yet.</div>
                            )}
                        </div>
                    </div>

                    {/* WIDGETS ROW 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attendance Trend */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Attendance Trend Over Months</h2>
                            {attendanceTrend.length > 0 ? (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={attendanceTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(tick) => `${tick}%`} />
                                            <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`${value}%`, 'Attendance']} />
                                            <Line type="monotone" dataKey="percentage" stroke="#10B981" strokeWidth={3} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed">No attendance recorded yet.</div>
                            )}
                        </div>

                        {/* 100% Attendance */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                🌟 100% Attendance Club
                            </h2>
                            {perfectAttendance.length > 0 ? (
                                <div className="flex-1 bg-green-50/50 rounded-lg p-4 border border-green-100 overflow-auto">
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {perfectAttendance.map((s, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-green-900 bg-white p-2 border border-green-100 rounded shadow-sm">
                                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                <span className="font-medium">{s.student}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed text-sm p-4 text-center">
                                    <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    No students with perfect attendance yet.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

