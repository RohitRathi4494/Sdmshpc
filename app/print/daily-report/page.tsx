'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MODE_COLOR: Record<string, string> = {
    CASH: '#059669', UPI: '#2563eb', CHEQUE: '#7c3aed',
    ONLINE: '#ea580c', BANK_TRANSFER: '#0891b2',
};

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
                if (json.success) {
                    setData(json.data);
                    setTimeout(() => window.print(), 600);
                } else setError(json.message || 'Failed to load');
            })
            .catch(() => setError('Network error'));
    }, [date, token]);

    if (error) return <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>{error}</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading report...</div>;

    const { totalCollection, summaryByMode, transactions } = data;

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Group by class
    const byClass: Record<string, number> = {};
    transactions.forEach((t: any) => {
        const k = t.class_name ? `${t.class_name}${t.section_name ? ' - ' + t.section_name : ''}` : 'Unknown';
        byClass[k] = (byClass[k] || 0) + Number(t.amount_paid);
    });

    const s: Record<string, React.CSSProperties> = {
        page: { fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#111', maxWidth: 900, margin: '0 auto', padding: 24 },
        header: { textAlign: 'center', borderBottom: '2px solid #4f46e5', paddingBottom: 12, marginBottom: 18 },
        school: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
        subtitle: { fontSize: 11, color: '#555', marginTop: 2 },
        sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' as const, borderBottom: '1px solid #ccc', paddingBottom: 4, marginBottom: 8, marginTop: 18, color: '#333' },
        table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 11 },
        th: { border: '1px solid #e2e8f0', padding: '5px 8px', background: '#f8fafc', fontWeight: 'bold', textAlign: 'left' as const },
        td: { border: '1px solid #e2e8f0', padding: '4px 8px' },
        tdRight: { border: '1px solid #e2e8f0', padding: '4px 8px', textAlign: 'right' as const },
        summaryBand: { display: 'flex', gap: 10, marginBottom: 18 },
        summaryCard: { flex: 1, border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 14px', borderTop: '3px solid #4f46e5' },
        footer: { marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' },
    };

    return (
        <div style={s.page}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.school}>S D Memorial Sr. Sec. School</div>
                <div style={s.subtitle}>Daily Fee Collection Report</div>
                <div style={{ ...s.subtitle, marginTop: 4, fontWeight: 'bold', color: '#333' }}>{displayDate}</div>
            </div>

            {/* Summary Band */}
            <div style={s.summaryBand}>
                <div style={{ ...s.summaryCard, borderTopColor: '#4f46e5' }}>
                    <div style={{ fontSize: 10, color: '#666' }}>TOTAL COLLECTED</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4f46e5', marginTop: 2 }}>{fmt(totalCollection)}</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</div>
                </div>
                {Object.entries(summaryByMode).map(([mode, amount]: any) => (
                    <div key={mode} style={{ ...s.summaryCard, borderTopColor: MODE_COLOR[mode] || '#6b7280' }}>
                        <div style={{ fontSize: 10, color: '#666' }}>{mode}</div>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: MODE_COLOR[mode] || '#6b7280', marginTop: 2 }}>{fmt(amount)}</div>
                        <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                            {totalCollection ? ((amount / totalCollection) * 100).toFixed(0) : 0}% of total
                        </div>
                    </div>
                ))}
            </div>

            {/* Mode-wise Table */}
            <div style={s.sectionTitle}>Payment Mode Summary</div>
            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={s.th}>Payment Mode</th>
                        <th style={{ ...s.th, textAlign: 'right' }}>Amount</th>
                        <th style={{ ...s.th, textAlign: 'right' }}>% Share</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(summaryByMode).map(([mode, amount]: any) => (
                        <tr key={mode}>
                            <td style={s.td}>{mode}</td>
                            <td style={s.tdRight}>{fmt(amount)}</td>
                            <td style={s.tdRight}>{totalCollection ? ((amount / totalCollection) * 100).toFixed(1) : 0}%</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                        <td style={s.td}>TOTAL</td>
                        <td style={s.tdRight}>{fmt(totalCollection)}</td>
                        <td style={s.tdRight}>100%</td>
                    </tr>
                </tfoot>
            </table>

            {/* Class-wise Table */}
            {Object.keys(byClass).length > 0 && (
                <>
                    <div style={s.sectionTitle}>Class-wise Collection</div>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Class</th>
                                <th style={{ ...s.th, textAlign: 'right' }}>Amount Collected</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(byClass).sort((a, b) => b[1] - a[1]).map(([cls, amt]) => (
                                <tr key={cls}>
                                    <td style={s.td}>{cls}</td>
                                    <td style={s.tdRight}>{fmt(amt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Transactions Table */}
            <div style={s.sectionTitle}>Transaction Details ({transactions.length})</div>
            <table style={s.table}>
                <thead>
                    <tr>
                        <th style={s.th}>Receipt No</th>
                        <th style={s.th}>Student Name</th>
                        <th style={s.th}>Adm No</th>
                        <th style={s.th}>Class</th>
                        <th style={s.th}>Mode</th>
                        <th style={{ ...s.th, textAlign: 'right' }}>Amount</th>
                        <th style={{ ...s.th, textAlign: 'right' }}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#999' }}>No transactions</td></tr>
                    ) : transactions.map((t: any, i: number) => (
                        <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                            <td style={s.td}>REC-{t.id}</td>
                            <td style={s.td}>{t.student_name}</td>
                            <td style={s.td}>{t.admission_no}</td>
                            <td style={s.td}>{t.class_name}{t.section_name ? `-${t.section_name}` : ''}</td>
                            <td style={s.td}>{t.payment_mode}</td>
                            <td style={{ ...s.tdRight, fontWeight: 'bold' }}>{fmt(Number(t.amount_paid))}</td>
                            <td style={s.tdRight}>
                                {new Date(t.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#eff6ff', fontWeight: 'bold' }}>
                        <td colSpan={5} style={{ ...s.td, textAlign: 'right' }}>DAY TOTAL</td>
                        <td style={{ ...s.tdRight, color: '#4f46e5', fontSize: 13 }}>{fmt(totalCollection)}</td>
                        <td style={s.td}></td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer */}
            <div style={s.footer}>
                <span>Printed: {new Date().toLocaleString('en-IN')}</span>
                <span>S D Memorial Sr. Sec. School — School Management System</span>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ borderTop: '1px solid #ccc', paddingTop: 4, width: 130, display: 'inline-block' }}>
                        Authorised Signatory
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 1cm; size: A4 landscape; }
                    body { margin: 0; }
                }
            `}</style>
        </div>
    );
}

export default function PrintDailyReportPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading report...</div>}>
            <PrintDailyReportContent />
        </Suspense>
    );
}
