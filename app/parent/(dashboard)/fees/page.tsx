'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const modeLabel: Record<string, string> = {
    CASH: '💵 Cash', UPI: '📱 UPI', CHEQUE: '🧾 Cheque',
    ONLINE: '🌐 Online', BANK_TRANSFER: '🏦 Bank Transfer',
};

export default function ParentFeePage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('hpc_token') || '';
        if (!token) { router.push('/parent/login'); return; }

        fetch('/api/parent/fees', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(json => {
                if (json.success) setData(json.data);
                else setError(json.message || 'Failed to load fee data');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-500">
            <p className="text-lg font-semibold">Error loading fee data</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                ← Go Back
            </button>
        </div>
    );

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Fee Status</h1>
                    <p className="text-sm text-gray-500">{data?.student?.class_name} · {data?.student?.year_name}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">Pending Dues</p>
                    <p className="text-2xl font-bold text-red-600">{fmt(data?.totalDue || 0)}</p>
                    <p className="text-xs text-red-400 mt-1">{data?.pendingDues?.length || 0} item(s) overdue</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-700">{fmt(data?.totalPaid || 0)}</p>
                    <p className="text-xs text-green-500 mt-1">{data?.history?.length || 0} payment(s)</p>
                </div>
            </div>

            {/* Pending Dues */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span>
                    <h2 className="font-semibold text-gray-800">Pending Dues</h2>
                    <span className="ml-auto text-xs text-gray-400">As of today</span>
                </div>

                {data?.pendingDues?.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                        <div className="text-4xl mb-2">✅</div>
                        <p className="font-medium text-gray-600">No pending dues!</p>
                        <p className="text-sm">All fees up to date are paid.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {data.pendingDues.map((due: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{due.head_name}</p>
                                    {due.month_label && (
                                        <p className="text-xs text-gray-400">{due.month_label}</p>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-red-600">{fmt(due.amount)}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-5 py-3 bg-red-50">
                            <span className="text-sm font-bold text-gray-700">Total Due</span>
                            <span className="text-base font-bold text-red-600">{fmt(data.totalDue)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-green-500">💳</span>
                    <h2 className="font-semibold text-gray-800">Payment History</h2>
                </div>

                {data?.history?.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                        <p className="text-sm">No payments recorded yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {data.history.map((batch: any, i: number) => (
                            <div key={i} className="px-5 py-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {new Date(batch.payment_date).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {modeLabel[batch.payment_mode] || batch.payment_mode}
                                            {batch.transaction_reference && ` · Ref: ${batch.transaction_reference}`}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-green-700">{fmt(batch.total_amount)}</span>
                                </div>
                                {/* Items in this payment */}
                                <div className="space-y-1 mt-2">
                                    {batch.items.map((item: any, j: number) => (
                                        <div key={j} className="flex justify-between text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded">
                                            <span>{item.head_name}{item.month_label ? ` – ${item.month_label}` : ''}</span>
                                            <span>{fmt(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
