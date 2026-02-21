'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BalanceStatementPage({ params }: { params: { studentId: string } }) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/office/fees/balance/${params.studentId}?token=${token}`)
            .then(r => r.json())
            .then(json => {
                if (json.success) {
                    setData(json.data);
                    setTimeout(() => window.print(), 800);
                } else setError(json.message);
            })
            .catch(() => setError('Failed to load'));
    }, [params.studentId, token]);

    if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;
    if (!data) return <div className="p-8 text-center text-gray-400">Loading Balance Statement...</div>;

    const { student, feeDetails, history, summary } = data;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Group fee details by head_name
    const grouped: Record<string, any[]> = {};
    for (const row of feeDetails) {
        if (!grouped[row.head_name]) grouped[row.head_name] = [];
        grouped[row.head_name].push(row);
    }

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#1a1a1a', maxWidth: '800px', margin: '0 auto', padding: '24px' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1a56db', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a56db' }}>SDMS HPC SCHOOL</div>
                <div style={{ fontSize: '11px', color: '#666' }}>Fee Balance Statement</div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>As of {today}</div>
            </div>

            {/* Student Info */}
            <table style={{ width: '100%', marginBottom: '16px', fontSize: '12px' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '3px 0', width: '50%' }}>
                            <strong>Student Name:</strong> {student.student_name}
                        </td>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Adm No:</strong> {student.admission_no}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Father's Name:</strong> {student.father_name}
                        </td>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Class:</strong> {student.class_name}{student.section_name ? ` - ${student.section_name}` : ''}
                            {student.stream ? ` (${student.stream})` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '3px 0' }} colSpan={2}>
                            <strong>Academic Year:</strong> {student.year_name}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Summary Band */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[
                    { label: 'Total Demand', value: fmt(summary.totalDemand), color: '#1a56db', bg: '#eff6ff' },
                    { label: 'Total Paid', value: fmt(summary.totalPaid), color: '#065f46', bg: '#ecfdf5' },
                    { label: 'Outstanding Balance', value: fmt(summary.totalBalance), color: '#b91c1c', bg: '#fef2f2' },
                ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.color}30`, borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Fee Wise Breakdown */}
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                FEE-WISE LEDGER
            </div>
            {Object.entries(grouped).map(([headName, rows]) => {
                const isMonthly = rows.length > 1;
                const headTotal = rows.reduce((s, r) => s + r.amount, 0);
                const headPaid = rows.reduce((s, r) => s + r.total_paid, 0);
                const headBalance = rows.reduce((s, r) => s + r.balance, 0);

                return (
                    <div key={headName} style={{ marginBottom: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '4px 8px', fontWeight: 'bold', fontSize: '11px', borderLeft: '3px solid #1a56db', marginBottom: '4px' }}>
                            {headName} — Total: {fmt(headTotal)} | Paid: {fmt(headPaid)} | Balance: {fmt(headBalance)}
                        </div>

                        {isMonthly ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9' }}>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left' }}>Month</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>Amount</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>Paid</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>Balance</th>
                                        <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r, i) => (
                                        <tr key={i} style={{ background: r.status === 'PAID' ? '#f0fdf4' : r.status === 'PARTIAL' ? '#fffbeb' : r.balance > 0 && new Date(r.due_date) < new Date() ? '#fef2f2' : 'white' }}>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{r.month_label || '-'}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{fmt(r.amount)}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{fmt(r.total_paid)}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right', color: r.balance > 0 ? '#b91c1c' : '#065f46', fontWeight: r.balance > 0 ? 'bold' : 'normal' }}>{fmt(r.balance)}</td>
                                            <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: r.status === 'PAID' ? '#065f46' : r.status === 'PARTIAL' ? '#b45309' : '#b91c1c' }}>
                                                {r.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ display: 'flex', gap: '12px', padding: '4px 8px', background: rows[0].status === 'PAID' ? '#f0fdf4' : '#fef2f2', borderRadius: '4px' }}>
                                <span>Amount: {fmt(rows[0].amount)}</span>
                                <span>Paid: {fmt(rows[0].total_paid)}</span>
                                <span style={{ color: rows[0].balance > 0 ? '#b91c1c' : '#065f46', fontWeight: 'bold' }}>Balance: {fmt(rows[0].balance)}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: rows[0].status === 'PAID' ? '#065f46' : '#b91c1c' }}>{rows[0].status}</span>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Payment History */}
            {history.length > 0 && (
                <>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginTop: '16px' }}>
                        PAYMENT HISTORY
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left' }}>Receipt</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left' }}>Date</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left' }}>Fee Head</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'left' }}>Mode</th>
                                <th style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((pay: any) => (
                                <tr key={pay.id}>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>REC-{pay.id}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{new Date(pay.payment_date).toLocaleDateString('en-IN')}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{pay.head_name || '-'}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px' }}>{pay.payment_mode}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '3px 6px', textAlign: 'right' }}>{fmt(Number(pay.amount_paid))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right' }}>Total Paid:</td>
                                <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', textAlign: 'right', color: '#065f46' }}>{fmt(summary.totalPaid)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </>
            )}

            {/* Outstanding Banner */}
            {summary.totalBalance > 0 && (
                <div style={{ marginTop: '16px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#b91c1c' }}>OUTSTANDING BALANCE DUE</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#b91c1c' }}>{fmt(summary.totalBalance)}</span>
                </div>
            )}
            {summary.totalBalance === 0 && (
                <div style={{ marginTop: '16px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', textAlign: 'center', color: '#065f46', fontWeight: 'bold' }}>
                    ✓ ALL FEES PAID — NO OUTSTANDING BALANCE
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                <span>Generated: {today}</span>
                <span>School Management System</span>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ borderTop: '1px solid #888', width: '120px', display: 'inline-block', paddingTop: '4px' }}>Authorized Signatory</div>
                </div>
            </div>

            <style>{`@media print { button { display: none; } }`}</style>
        </div>
    );
}
