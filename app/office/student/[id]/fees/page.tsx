'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentFeeLedgerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    // In Next.js 15, params is a Promise. In 14 it's an object. 
    // To be safe and fix potentially empty params issue:
    // const resolvedParams = React.use(params as any) as { id: string }; 
    const studentId = params.id;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isPayModalOpen, setPayModalOpen] = useState(false);

    // Payment Form
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('CASH');
    const [ref, setRef] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (studentId) {
            fetchLedger();
        }
    }, [studentId]);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token');
            const res = await fetch(`/api/office/student/${studentId}/fees`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                // Pre-fill amount with balance if available
                if (json.data.balance > 0) {
                    setAmount(json.data.balance.toString());
                }
            } else {
                const err = await res.json();
                setErrorMsg(err.message || 'Failed to load data');
                setData(null);
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message || 'Network error');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        setSubmitting(true);
        try {
            const token = sessionStorage.getItem('hpc_token');
            const res = await fetch('/api/office/fees/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: studentId,
                    amount_paid: parseFloat(amount),
                    payment_mode: mode,
                    transaction_reference: ref,
                    remarks
                })
            });

            if (res.ok) {
                const json = await res.json();
                const receiptId = json.data.id;

                // Close modal and refresh
                setPayModalOpen(false);
                setAmount('');
                setRef('');
                setRemarks('');
                fetchLedger();

                // Open Receipt in new tab
                window.open(`/api/office/fees/receipt/${receiptId}/pdf`, '_blank');
            } else {
                const err = await res.json();
                alert(err.message || 'Payment failed');
            }
        } catch (e) {
            console.error(e);
            alert('Payment failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Ledger...</div>;
    if (!data) return (
        <div className="p-8 text-center text-red-500">
            <h3 className="font-bold text-lg mb-2">Error Loading Data</h3>
            <p>{errorMsg || 'Student not found.'}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-gray-800">Retry</button>
        </div>
    );

    const { student, structure, history, totalDue, totalPaid, balance } = data;

    return (
        <div className="space-y-6">
            <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-800 flex items-center mb-4"
            >
                ← Back to List
            </button>

            {/* Student Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{student.student_name}</h1>
                    <div className="text-gray-500 mt-1 space-x-4">
                        <span>Adm No: <strong className="text-gray-800">{student.admission_no}</strong></span>
                        <span>Class: <strong className="text-gray-800">{student.class_name || 'N/A'}</strong></span>
                        <span>Year: <strong className="text-gray-800">{student.year_name || 'N/A'}</strong></span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <div className="text-sm text-gray-500">Net Balance Due</div>
                    <div className={`text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{balance}
                    </div>
                    {balance > 0 && (
                        <button
                            onClick={() => setPayModalOpen(true)}
                            className="mt-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
                        >
                            Pay Fees
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fee Structure (Demands) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Fee Structure (Demands)</h3>
                    {structure.length === 0 ? (
                        <p className="text-gray-500">No fees assigned to this class/year.</p>
                    ) : (
                        <div className="space-y-3">
                            {structure.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <div className="font-medium text-gray-800">{item.head_name}</div>
                                        <div className="text-xs text-gray-400">Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No Date'}</div>
                                    </div>
                                    <div className="font-semibold text-gray-700">₹{item.amount}</div>
                                </div>
                            ))}
                            <div className="flex justify-between pt-4 font-bold text-lg border-t border-gray-200">
                                <span>Total Demanded</span>
                                <span>₹{totalDue}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment History */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Payment History</h3>
                    {history.length === 0 ? (
                        <p className="text-gray-500">No payments recorded yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((pay: any) => (
                                <div key={pay.id} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 p-2 rounded transition">
                                    <div>
                                        <div className="font-bold text-gray-800">₹{pay.amount_paid}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(pay.payment_date).toLocaleDateString()} • {pay.payment_mode}
                                        </div>
                                        <div className="text-xs text-gray-400">REC-{pay.id}</div>
                                    </div>
                                    <button
                                        onClick={() => window.open(`/api/office/fees/receipt/${pay.id}/pdf`, '_blank')}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
                                    >
                                        Receipt PDF
                                    </button>
                                </div>
                            ))}
                            <div className="flex justify-between pt-4 font-bold text-lg border-t border-gray-200">
                                <span>Total Paid</span>
                                <span className="text-emerald-600">₹{totalPaid}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal manually implemented to avoid complex library dependencies */}
            {isPayModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Record Fee Payment</h3>
                            <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="UPI">UPI/Online</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                </select>
                            </div>

                            {mode !== 'CASH' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Cheque No</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={ref}
                                        onChange={(e) => setRef(e.target.value)}
                                        placeholder="e.g. UPI Ref, DD Number"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Any notes..."
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setPayModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={submitting}
                                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                            >
                                {submitting ? 'Processing...' : 'Collect & Generate Receipt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
