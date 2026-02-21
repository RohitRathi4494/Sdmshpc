'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MonthFee {
    fee_structure_id: number;
    head_name: string;
    amount: number;
    due_date: string;
    month_label: string;
    month_short: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    payment_id: number | null;
    payment_date: string | null;
    payment_mode: string | null;
    batch_id: string | null;
}

interface OtherFee {
    fee_structure_id: number;
    head_name: string;
    amount: number;
    status: 'PAID' | 'PENDING';
    payment_id: number | null;
}

interface LedgerData {
    student: any;
    monthlyFees: MonthFee[];
    otherFees: OtherFee[];
    history: any[];
    totalPaid: number;
    totalDue: number;
    balance: number;
}

// ─── Month Chip ───────────────────────────────────────────────────────────────
function MonthChip({
    fee, selected, onToggle,
}: { fee: MonthFee; selected: boolean; onToggle: () => void }) {
    const canSelect = fee.status !== 'PAID';

    if (fee.status === 'PAID') {
        return (
            <div className="flex flex-col items-center p-2 rounded-lg bg-emerald-50 border border-emerald-200 min-w-[62px]">
                <span className="text-xs font-bold text-emerald-700">{fee.month_short}</span>
                <span className="text-emerald-500 text-lg">✓</span>
                <span className="text-[10px] text-emerald-600">Paid</span>
            </div>
        );
    }

    const isOverdue = fee.status === 'OVERDUE';

    return (
        <button
            onClick={onToggle}
            className={`flex flex-col items-center p-2 rounded-lg border-2 min-w-[62px] transition-all cursor-pointer ${selected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105'
                    : isOverdue
                        ? 'bg-red-50 border-red-400 hover:bg-red-100'
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
        >
            <span className={`text-xs font-bold ${selected ? 'text-white' : isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                {fee.month_short}
            </span>
            <span className={`text-lg ${selected ? 'text-white' : 'text-gray-400'}`}>
                {selected ? '☑' : '☐'}
            </span>
            <span className={`text-[10px] ${selected ? 'text-indigo-100' : isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                {isOverdue ? 'Due' : 'Pending'}
            </span>
        </button>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentFeeLedgerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const studentId = params.id;

    const [data, setData] = useState<LedgerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Selection: Set of fee_structure_ids
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Payment modal
    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState('CASH');
    const [refNo, setRefNo] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLedger = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const token = sessionStorage.getItem('hpc_token');
            const res = await fetch(`/api/office/student/${studentId}/fees`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (res.ok && json.success) {
                setData(json.data);
                setSelected(new Set()); // Reset selection on refresh
            } else {
                setErrorMsg(json.message || 'Failed to load data');
            }
        } catch (e: any) {
            setErrorMsg(e.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const toggleMonth = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleOther = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAllPending = () => {
        if (!data) return;
        const pendingIds = [
            ...data.monthlyFees.filter(f => f.status !== 'PAID').map(f => f.fee_structure_id),
            ...data.otherFees.filter(f => f.status !== 'PAID').map(f => f.fee_structure_id),
        ];
        setSelected(new Set(pendingIds));
    };

    const clearSelection = () => setSelected(new Set());

    // Compute selected amount
    const selectedItems = data
        ? [
            ...data.monthlyFees.filter(f => selected.has(f.fee_structure_id)),
            ...data.otherFees.filter(f => selected.has(f.fee_structure_id)),
        ]
        : [];
    const selectedTotal = selectedItems.reduce((s, f) => s + f.amount, 0);

    const handleCollect = async () => {
        if (selectedItems.length === 0) return;
        setSubmitting(true);
        try {
            const token = sessionStorage.getItem('hpc_token');
            const items = [...selected].map(id => ({ fee_structure_id: id }));

            const res = await fetch('/api/office/fees/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    student_id: parseInt(studentId),
                    items,
                    payment_mode: mode,
                    transaction_reference: refNo || null,
                    remarks: remarks || null,
                }),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setShowModal(false);
                setRefNo('');
                setRemarks('');
                await fetchLedger();

                // Open receipt
                const pdfToken = sessionStorage.getItem('hpc_token');
                window.open(`/api/office/fees/receipt/${json.data.first_payment_id}/pdf?token=${pdfToken}`, '_blank');
            } else {
                alert(json.message || 'Payment failed');
            }
        } catch (e) {
            alert('Payment failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading fee ledger...</p>
            </div>
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center">
            <div className="text-red-500 mb-2 font-bold text-lg">Error Loading Data</div>
            <p className="text-red-400 mb-4">{errorMsg}</p>
            <button onClick={fetchLedger} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-800">↺ Retry</button>
        </div>
    );

    const { student, monthlyFees, otherFees, history, totalPaid, totalDue } = data;
    const pendingCount = monthlyFees.filter(f => f.status !== 'PAID').length + otherFees.filter(f => f.status !== 'PAID').length;

    // Group monthly fees by head_name (there might be multiple monthly heads)
    const monthlyGroups = monthlyFees.reduce((acc: Record<string, MonthFee[]>, f) => {
        if (!acc[f.head_name]) acc[f.head_name] = [];
        acc[f.head_name].push(f);
        return acc;
    }, {});

    return (
        <div className="space-y-4 pb-28"> {/* pb-28 for sticky footer */}

            {/* ── Back + Student Header ─────────────────────────────────── */}
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
                ← Back to List
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{student.student_name}</h1>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                        <span>Adm No: <strong className="text-gray-800">{student.admission_no}</strong></span>
                        <span>Class: <strong className="text-gray-800">{student.class_name || 'N/A'}{student.section_name ? ` - ${student.section_name}` : ''}</strong></span>
                        <span>Year: <strong className="text-gray-800">{student.year_name || 'N/A'}</strong></span>
                        {student.stream && <span>Stream: <strong className="text-gray-800">{student.stream}</strong></span>}
                    </div>
                </div>
                <div className="flex gap-6 text-right">
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Total Paid</div>
                        <div className="text-xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Outstanding</div>
                        <div className={`text-xl font-bold ${totalDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            ₹{totalDue.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Monthly Fees ─────────────────────────────────────────── */}
            {Object.entries(monthlyGroups).map(([headName, fees]) => {
                const paidCount = fees.filter(f => f.status === 'PAID').length;
                const monthAmount = fees[0]?.amount || 0;
                return (
                    <div key={headName} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">{headName}</h3>
                                <p className="text-sm text-gray-500">₹{monthAmount.toLocaleString()} / month • {paidCount}/12 months paid</p>
                            </div>
                            <div className="flex gap-2">
                                {fees.some(f => f.status !== 'PAID') && (
                                    <button
                                        onClick={() => {
                                            const unpaidIds = fees.filter(f => f.status !== 'PAID').map(f => f.fee_structure_id);
                                            setSelected(prev => {
                                                const next = new Set(prev);
                                                const allSelected = unpaidIds.every(id => next.has(id));
                                                unpaidIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
                                                return next;
                                            });
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition"
                                    >
                                        Toggle All Pending
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Month chips grid */}
                        <div className="flex flex-wrap gap-2">
                            {fees.map(fee => (
                                <MonthChip
                                    key={fee.fee_structure_id}
                                    fee={fee}
                                    selected={selected.has(fee.fee_structure_id)}
                                    onToggle={() => toggleMonth(fee.fee_structure_id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* ── One-Time / Other Fees ────────────────────────────────── */}
            {otherFees.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Other Fees</h3>
                    <div className="space-y-2">
                        {otherFees.map(fee => (
                            <div key={fee.fee_structure_id}
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                            >
                                <div>
                                    <span className="font-medium text-gray-800">{fee.head_name}</span>
                                    <span className="ml-3 text-sm text-gray-500">₹{fee.amount.toLocaleString()}</span>
                                </div>
                                {fee.status === 'PAID' ? (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">✓ PAID</span>
                                ) : (
                                    <button
                                        onClick={() => toggleOther(fee.fee_structure_id)}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border-2 transition ${selected.has(fee.fee_structure_id)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                                            }`}
                                    >
                                        {selected.has(fee.fee_structure_id) ? '☑ Selected' : '☐ Select'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── No Fees State ────────────────────────────────────────── */}
            {monthlyFees.length === 0 && otherFees.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="font-medium">No fee structure found for this student's class and academic year.</p>
                    <p className="text-sm mt-1">Please configure fees in the Fee Configuration tab.</p>
                </div>
            )}

            {/* ── Payment History ──────────────────────────────────────── */}
            {history.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-800 mb-3">Payment History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <th className="pb-2 text-left font-semibold">Receipt</th>
                                    <th className="pb-2 text-left font-semibold">Date</th>
                                    <th className="pb-2 text-left font-semibold">Mode</th>
                                    <th className="pb-2 text-right font-semibold">Amount</th>
                                    <th className="pb-2 text-right font-semibold">PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((pay: any) => (
                                    <tr key={pay.id} className="hover:bg-gray-50">
                                        <td className="py-2 text-indigo-600 font-medium">REC-{pay.id}</td>
                                        <td className="py-2 text-gray-600">
                                            {new Date(pay.payment_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-2">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                {pay.payment_mode}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right font-semibold text-gray-800">
                                            ₹{Number(pay.amount_paid).toLocaleString()}
                                        </td>
                                        <td className="py-2 text-right">
                                            <button
                                                onClick={() => {
                                                    const t = sessionStorage.getItem('hpc_token');
                                                    window.open(`/api/office/fees/receipt/${pay.id}/pdf?token=${t}`, '_blank');
                                                }}
                                                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition"
                                            >
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Sticky Collect Footer ────────────────────────────────── */}
            {selected.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-indigo-100 shadow-2xl px-6 py-4">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Selected</div>
                                <div className="font-bold text-gray-800">{selected.size} item{selected.size > 1 ? 's' : ''}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Amount</div>
                                <div className="text-2xl font-bold text-indigo-600">₹{selectedTotal.toLocaleString()}</div>
                            </div>
                            <div className="hidden md:block text-sm text-gray-400">
                                {selectedItems.map(f => ('month_short' in f ? (f as MonthFee).month_short : f.head_name)).join(' + ')}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={clearSelection}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                            >
                                Collect Now →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Payment Collection Modal ─────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Record Payment</h3>
                                <p className="text-sm text-gray-500">
                                    {selected.size} item{selected.size > 1 ? 's' : ''} • <strong className="text-indigo-600">₹{selectedTotal.toLocaleString()}</strong>
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                        </div>

                        {/* Month summary in modal */}
                        <div className="px-5 pt-4">
                            <div className="flex flex-wrap gap-1 mb-4">
                                {selectedItems.map(f => (
                                    <span key={f.fee_structure_id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                                        {'month_short' in f ? (f as MonthFee).month_label : f.head_name} — ₹{f.amount.toLocaleString()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="px-5 pb-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['CASH', 'UPI', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setMode(m)}
                                            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${mode === m
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                                }`}
                                        >
                                            {m === 'BANK_TRANSFER' ? 'Bank' : m === 'ONLINE' ? 'Online' : m.charAt(0) + m.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {mode !== 'CASH' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        {mode === 'CHEQUE' ? 'Cheque Number' : mode === 'UPI' ? 'UPI Reference' : 'Transaction Reference'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={refNo}
                                        onChange={e => setRefNo(e.target.value)}
                                        placeholder="Enter reference number"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                    placeholder="Any notes..."
                                />
                            </div>

                            {/* Total Confirm */}
                            <div className="bg-indigo-50 rounded-xl p-4 flex justify-between items-center">
                                <span className="text-gray-700 font-semibold">Total to Collect</span>
                                <span className="text-2xl font-black text-indigo-700">₹{selectedTotal.toLocaleString()}</span>
                            </div>

                            <button
                                onClick={handleCollect}
                                disabled={submitting}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md transition text-lg"
                            >
                                {submitting ? '⏳ Processing...' : '✓ Collect & Generate Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
