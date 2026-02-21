'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
    id: number;
    student_name: string;
    admission_no: string;
    class_name: string;
    section_name: string;
    payment_mode: string;
    amount_paid: number;
    payment_date: string;
    transaction_reference?: string;
    batch_id?: string;
}

interface ReportData {
    date: string;
    totalCollection: number;
    summaryByMode: Record<string, number>;
    transactions: Transaction[];
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const MODE_COLORS: Record<string, { bg: string; text: string; bar: string; hex: string }> = {
    CASH: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', hex: '#10b981' },
    UPI: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', hex: '#3b82f6' },
    CHEQUE: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500', hex: '#a855f7' },
    ONLINE: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', hex: '#f97316' },
    BANK_TRANSFER: { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500', hex: '#06b6d4' },
    UNKNOWN: { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-400', hex: '#9ca3af' },
};
const getColor = (mode: string) => MODE_COLORS[mode] || MODE_COLORS.UNKNOWN;

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ data }: { data: Record<string, number> }) {
    const total = Object.values(data).reduce((s, v) => s + v, 0);
    if (total === 0) return (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
    );

    const R = 15.9155; // radius to make circumference ≈ 100
    const circumference = 2 * Math.PI * R;
    let offset = 0;
    const segments = Object.entries(data).map(([mode, amount]) => {
        const pct = (amount / total) * 100;
        const seg = { mode, amount, pct, offset, hex: getColor(mode).hex };
        offset += pct;
        return seg;
    });

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <svg viewBox="0 0 36 36" className="w-44 h-44 -rotate-90">
                    <circle cx="18" cy="18" r={R} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                    {segments.map(s => (
                        <circle
                            key={s.mode}
                            cx="18" cy="18" r={R}
                            fill="none"
                            stroke={s.hex}
                            strokeWidth="5"
                            strokeDasharray={`${s.pct * circumference / 100} ${circumference}`}
                            strokeDashoffset={-(s.offset * circumference / 100)}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <span className="text-xs text-gray-400">Total</span>
                    <span className="text-base font-black text-gray-800">{fmt(total)}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
                {segments.map(s => (
                    <div key={s.mode} className="flex items-center gap-1 text-xs text-gray-600">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: s.hex }}></span>
                        {s.mode} <span className="font-semibold">{s.pct.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Hourly Bar Chart ─────────────────────────────────────────────────────────
function HourlyChart({ transactions }: { transactions: Transaction[] }) {
    const hourly = Array(24).fill(0);
    transactions.forEach(t => {
        const h = new Date(t.payment_date).getHours();
        hourly[h] += Number(t.amount_paid);
    });

    const SHOW_HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am-9pm
    const maxVal = Math.max(...SHOW_HOURS.map(h => hourly[h]), 1);

    return (
        <div className="w-full">
            <div className="flex items-end gap-1 h-28">
                {SHOW_HOURS.map(h => {
                    const val = hourly[h];
                    const pct = (val / maxVal) * 100;
                    return (
                        <div key={h} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                            {val > 0 && (
                                <div className="absolute bottom-6 hidden group-hover:block bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                                    {fmt(val)}
                                </div>
                            )}
                            <div className="w-full rounded-t transition-all" style={{ height: `${Math.max(pct, 2)}%`, background: val > 0 ? '#6366f1' : '#e5e7eb' }}></div>
                            <span className="text-[10px] text-gray-400">{h % 12 || 12}{h < 12 ? 'a' : 'p'}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DailyReportTab() {
    const todayIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [date, setDate] = useState(todayIST);
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token');
            const res = await fetch(`/api/office/fees/reports/daily?date=${date}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) setReport(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    if (loading && !report) return (
        <div className="flex items-center justify-center h-60">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Fetching report...</p>
            </div>
        </div>
    );

    // Compute derived metrics
    const txns = report?.transactions ?? [];
    const summaryByMode = report?.summaryByMode ?? {};
    const totalCollection = report?.totalCollection ?? 0;

    // Class-wise breakdown
    const byClass: Record<string, number> = {};
    txns.forEach(t => {
        const cls = t.class_name ? `${t.class_name}${t.section_name ? ' - ' + t.section_name : ''}` : 'Unknown';
        byClass[cls] = (byClass[cls] || 0) + Number(t.amount_paid);
    });
    const classEntries = Object.entries(byClass).sort((a, b) => b[1] - a[1]);
    const classMax = classEntries[0]?.[1] || 1;

    // Filtered transactions
    const filtered = txns.filter(t =>
        t.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
        t.class_name?.toLowerCase().includes(search.toLowerCase())
    );

    const isToday = date === todayIST;
    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="space-y-5 pb-6">

            {/* ── Header Bar ──────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="text-xl font-bold">Daily Fee Report</h2>
                    <p className="text-indigo-200 text-sm mt-0.5">{displayDate}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setDate(new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0])}
                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-lg transition">‹</button>
                    <input
                        type="date"
                        value={date}
                        max={todayIST}
                        onChange={e => setDate(e.target.value)}
                        className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
                    />
                    {!isToday && (
                        <button onClick={() => setDate(todayIST)}
                            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-lg transition">›</button>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition text-sm ml-2"
                    >
                        🖨 Print
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1 flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Total Collected</span>
                    <span className="text-3xl font-black text-indigo-700 mt-1">{fmt(totalCollection)}</span>
                    <span className="text-xs text-gray-400 mt-1">{txns.length} transaction{txns.length !== 1 ? 's' : ''}</span>
                </div>
                {/* Per mode */}
                {Object.entries(summaryByMode).map(([mode, amount]) => {
                    const c = getColor(mode);
                    return (
                        <div key={mode} className={`${c.bg} rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col`}>
                            <span className={`text-xs uppercase tracking-wider ${c.text} font-semibold`}>{mode}</span>
                            <span className={`text-2xl font-black mt-1 ${c.text}`}>{fmt(amount)}</span>
                            <div className="mt-2 bg-white/60 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${(Number(amount) / totalCollection * 100).toFixed(0)}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">{totalCollection ? (Number(amount) / totalCollection * 100).toFixed(0) : 0}% of total</span>
                        </div>
                    );
                })}
                {Object.keys(summaryByMode).length === 0 && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 col-span-3 flex items-center justify-center text-gray-400 text-sm">
                        No collections on this date
                    </div>
                )}
            </div>

            {/* ── Charts Row ──────────────────────────────────────────────── */}
            {txns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Donut Chart */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Payment Mode Breakdown</h3>
                        <DonutChart data={summaryByMode} />
                    </div>

                    {/* Right column: hourly + class */}
                    <div className="space-y-4">

                        {/* Hourly Chart */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wider">Collection by Hour</h3>
                            <HourlyChart transactions={txns} />
                        </div>

                        {/* Class-wise */}
                        {classEntries.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Class-wise Collection</h3>
                                <div className="space-y-2">
                                    {classEntries.slice(0, 5).map(([cls, amt]) => (
                                        <div key={cls} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600 w-24 truncate">{cls}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(amt / classMax) * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-700 w-20 text-right">{fmt(amt)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Transactions Table ───────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-semibold text-gray-800">
                        Transactions <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search student / adm no..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 sm:w-60 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-5 py-3 text-left">Receipt</th>
                                <th className="px-5 py-3 text-left">Student</th>
                                <th className="px-5 py-3 text-left">Class</th>
                                <th className="px-5 py-3 text-left">Mode</th>
                                <th className="px-5 py-3 text-right">Amount</th>
                                <th className="px-5 py-3 text-right">Time</th>
                                <th className="px-5 py-3 text-right">PDF</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                                        <div className="text-3xl mb-2">📭</div>
                                        {txns.length === 0 ? 'No transactions recorded for this date.' : 'No matches found.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(t => {
                                    const c = getColor(t.payment_mode);
                                    return (
                                        <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-5 py-3 font-medium text-indigo-600 whitespace-nowrap">REC-{t.id}</td>
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-gray-800 whitespace-nowrap">{t.student_name}</div>
                                                <div className="text-xs text-gray-400">{t.admission_no}</div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                                                {t.class_name}{t.section_name ? `-${t.section_name}` : ''}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}>
                                                    {t.payment_mode}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right font-bold text-gray-800 whitespace-nowrap">
                                                {fmt(t.amount_paid)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-400 whitespace-nowrap text-xs">
                                                {new Date(t.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => {
                                                        const tok = sessionStorage.getItem('hpc_token');
                                                        window.open(`/api/office/fees/receipt/${t.id}/pdf?token=${tok}`, '_blank');
                                                    }}
                                                    className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition font-medium"
                                                >
                                                    PDF
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {filtered.length > 0 && (
                            <tfoot>
                                <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                                    <td colSpan={4} className="px-5 py-3 font-bold text-gray-600 text-right text-sm">Day Total</td>
                                    <td className="px-5 py-3 text-right font-black text-indigo-700 text-base">{fmt(totalCollection)}</td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <style>{`@media print { button { display:none; } }`}</style>
        </div>
    );
}
