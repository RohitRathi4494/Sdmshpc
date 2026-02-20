'use client';

import React, { useState, useEffect } from 'react';

export default function DailyReportTab() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [date]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const res = await fetch(`/api/office/fees/reports/daily?date=${date}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setReport(data.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !report) return <div>Loading Report...</div>;

    if (!report) return <div>No data available.</div>;

    const { totalCollection, summaryByMode, transactions } = report;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Daily Fee Summary</h3>
                <input
                    type="date"
                    className="p-2 border border-gray-300 rounded"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                    <span className="block text-2xl font-bold text-emerald-700">₹{totalCollection}</span>
                    <span className="text-sm text-emerald-600">Total Collected</span>
                </div>
                {Object.entries(summaryByMode).map(([mode, amount]: any) => (
                    <div key={mode} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <span className="block text-xl font-bold text-gray-700">₹{amount}</span>
                        <span className="text-sm text-gray-500">{mode}</span>
                    </div>
                ))}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-700">Transactions ({transactions.length})</h4>
                    {/* Export Button can be added here */}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">No transactions recorded for this date.</td>
                                </tr>
                            ) : (
                                transactions.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">REC-{t.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{t.student_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.admission_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.class_name}-{t.section_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.payment_mode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">₹{t.amount_paid}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {new Date(t.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a
                                                href={`/api/office/fees/receipt/${t.id}/pdf`}
                                                target="_blank"
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Receipt
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
