'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MODE_META: Record<string, { color: string; light: string; icon: string }> = {
    CASH: { color: '#059669', light: '#ecfdf5', icon: '💵' },
    UPI: { color: '#2563eb', light: '#eff6ff', icon: '📱' },
    CHEQUE: { color: '#7c3aed', light: '#f5f3ff', icon: '🏦' },
    ONLINE: { color: '#ea580c', light: '#fff7ed', icon: '🌐' },
    BANK_TRANSFER: { color: '#0891b2', light: '#ecfeff', icon: '🔄' },
};
const getMeta = (m: string) => MODE_META[m] || { color: '#6b7280', light: '#f9fafb', icon: '💳' };

function PrintDailyReportContent() {
    const searchParams = useSearchParams();
    const date = searchParams.get('date') || '';
    const token = searchParams.get('token') || '';

    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!date || !token) { setError('Missing date or token'); return; }
        fetch(`/api/office/fees/reports/daily?date=${date}&token=${token}`)
            .then(r => r.json())
            .then(json => {
                if (json.success) { setData(json.data); setTimeout(() => window.print(), 700); }
                else setError(json.message || 'Failed to load');
            })
            .catch(() => setError('Network error'));
    }, [date, token]);

    if (error) return <div style={{ padding: 40, color: '#dc2626', textAlign: 'center', fontFamily: 'Arial' }}>{error}</div>;
    if (!data) return <div style={{ padding: 40, color: '#6b7280', textAlign: 'center', fontFamily: 'Arial' }}>Loading report…</div>;

    const { totalCollection, summaryByMode, transactions } = data;

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // Class-wise breakdown
    const byClass: Record<string, number> = {};
    transactions.forEach((t: any) => {
        const k = t.class_name ? `${t.class_name}${t.section_name ? ' - ' + t.section_name : ''}` : 'Unknown';
        byClass[k] = (byClass[k] || 0) + Number(t.amount_paid);
    });
    const classEntries = Object.entries(byClass).sort((a, b) => b[1] - a[1]);

    const modeEntries = Object.entries(summaryByMode);

    return (
        <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#fff', maxWidth: 920, margin: '0 auto', padding: '28px 32px', color: '#1e293b' }}>

            {/* ── LETTERHEAD ─────────────────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: 12, padding: '20px 28px', marginBottom: 24, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>S D Memorial Sr. Sec. School</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>Daily Fee Collection Report</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.3)' }}>
                        {displayDate}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6 }}>
                        Generated: {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* ── SUMMARY CARDS ──────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {/* Grand total */}
                <div style={{ flex: '1 1 160px', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius: 10, padding: '16px 18px', color: '#fff', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
                    <div style={{ fontSize: 10, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total Collected</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalCollection)}</div>
                    <div style={{ fontSize: 10, opacity: 0.75, marginTop: 4 }}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</div>
                </div>
                {/* Per-mode cards */}
                {modeEntries.map(([mode, amount]: any) => {
                    const m = getMeta(mode);
                    const pct = totalCollection ? ((amount / totalCollection) * 100).toFixed(0) : '0';
                    return (
                        <div key={mode} style={{ flex: '1 1 140px', background: m.light, borderRadius: 10, padding: '16px 18px', border: `1px solid ${m.color}30`, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: 12, top: 12, fontSize: 22, opacity: 0.25 }}>{m.icon}</div>
                            <div style={{ fontSize: 10, color: m.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{mode}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{fmt(amount)}</div>
                            <div style={{ marginTop: 8 }}>
                                <div style={{ background: '#e5e7eb', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                                    <div style={{ background: m.color, width: `${pct}%`, height: '100%', borderRadius: 99 }}></div>
                                </div>
                                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>{pct}% of total</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── TWO-COLUMN: mode summary + class-wise ──────────── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>

                {/* Payment Mode Summary */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#4f46e5', marginBottom: 8, borderBottom: '2px solid #4f46e5', paddingBottom: 4 }}>Payment Mode Summary</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                            <tr style={{ background: '#4f46e5', color: '#fff' }}>
                                <th style={{ padding: '7px 10px', textAlign: 'left', borderRadius: '4px 0 0 4px', fontWeight: 600 }}>Mode</th>
                                <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                                <th style={{ padding: '7px 10px', textAlign: 'right', borderRadius: '0 4px 4px 0', fontWeight: 600 }}>Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modeEntries.map(([mode, amount]: any, i: number) => {
                                const m = getMeta(mode);
                                return (
                                    <tr key={mode} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: m.color }}></span>
                                            {mode}
                                        </td>
                                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(amount)}</td>
                                        <td style={{ padding: '6px 10px', textAlign: 'right', color: m.color, fontWeight: 600 }}>
                                            {totalCollection ? ((amount / totalCollection) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
                                <td style={{ padding: '7px 10px' }}>TOTAL</td>
                                <td style={{ padding: '7px 10px', textAlign: 'right', color: '#4f46e5', fontSize: 13 }}>{fmt(totalCollection)}</td>
                                <td style={{ padding: '7px 10px', textAlign: 'right' }}>100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Class-wise */}
                {classEntries.length > 0 && (
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 8, borderBottom: '2px solid #7c3aed', paddingBottom: 4 }}>Class-wise Collection</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                            <thead>
                                <tr style={{ background: '#7c3aed', color: '#fff' }}>
                                    <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600 }}>Class / Section</th>
                                    <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classEntries.map(([cls, amt], i) => (
                                    <tr key={cls} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                        <td style={{ padding: '6px 10px' }}>{cls}</td>
                                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(amt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── TRANSACTIONS TABLE ─────────────────────────────── */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#0f172a', marginBottom: 8, borderBottom: '2px solid #0f172a', paddingBottom: 4 }}>
                Transaction Details ({transactions.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: '#fff' }}>
                        {['Receipt', 'Student Name', 'Adm No', 'Class', 'Mode', 'Amount', 'Time'].map((h, i) => (
                            <th key={h} style={{ padding: '7px 9px', textAlign: i >= 5 ? 'right' : 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: '14px', textAlign: 'center', color: '#9ca3af' }}>No transactions</td></tr>
                    ) : transactions.map((t: any, i: number) => {
                        const m = getMeta(t.payment_mode);
                        return (
                            <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '5px 9px', color: '#4f46e5', fontWeight: 700 }}>REC-{t.id}</td>
                                <td style={{ padding: '5px 9px', fontWeight: 600 }}>{t.student_name}</td>
                                <td style={{ padding: '5px 9px', color: '#64748b' }}>{t.admission_no}</td>
                                <td style={{ padding: '5px 9px', color: '#64748b' }}>{t.class_name}{t.section_name ? `-${t.section_name}` : ''}</td>
                                <td style={{ padding: '5px 9px' }}>
                                    <span style={{ background: m.light, color: m.color, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{t.payment_mode}</span>
                                </td>
                                <td style={{ padding: '5px 9px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{fmt(Number(t.amount_paid))}</td>
                                <td style={{ padding: '5px 9px', textAlign: 'right', color: '#94a3b8' }}>
                                    {new Date(t.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr style={{ background: 'linear-gradient(90deg,#eff6ff,#f5f3ff)', borderTop: '2px solid #4f46e5' }}>
                        <td colSpan={5} style={{ padding: '8px 9px', fontWeight: 700, textAlign: 'right', color: '#374151' }}>DAY GRAND TOTAL</td>
                        <td style={{ padding: '8px 9px', textAlign: 'right', fontWeight: 900, color: '#4f46e5', fontSize: 14 }}>{fmt(totalCollection)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <div style={{ marginTop: 28, borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 10, color: '#94a3b8' }}>
                <div>
                    <div style={{ fontWeight: 700, color: '#64748b' }}>S D Memorial Sr. Sec. School</div>
                    <div>Fee Management System</div>
                </div>
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 9 }}>
                    This is a computer-generated report. No signature required.
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ borderTop: '1px solid #94a3b8', paddingTop: 6, width: 130, display: 'inline-block', color: '#475569' }}>
                        Authorised Signatory
                    </div>
                </div>
            </div>

            <style>{`
                * { box-sizing: border-box; }
                @media print {
                    @page { margin: 0.8cm; size: A4 landscape; }
                    body  { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}

export default function PrintDailyReportPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading report…</div>}>
            <PrintDailyReportContent />
        </Suspense>
    );
}
