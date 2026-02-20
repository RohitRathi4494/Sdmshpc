'use client';

import React, { useState, useEffect } from 'react';

export default function FeeConfigTab() {
    const [heads, setHeads] = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form States
    const [newHeadName, setNewHeadName] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedHead, setSelectedHead] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [stream, setStream] = useState('');
    const [subjectCount, setSubjectCount] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = sessionStorage.getItem('hpc_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [headsRes, classesRes, yearsRes] = await Promise.all([
                fetch('/api/office/fees/heads', { headers }),
                fetch('/api/admin/classes', { headers }),
                fetch('/api/admin/academic-years', { headers }) // Assuming this exists
            ]);

            if (headsRes.ok) {
                const data = await headsRes.json();
                setHeads(data.data || []);
            }
            if (classesRes.ok) {
                const data = await classesRes.json();
                setClasses(data.data || []); // Fixed: API returns { data: [...] }
            }
            if (yearsRes.ok) {
                const data = await yearsRes.json();
                setAcademicYears(data.data || []);
                // Set default active year
                const active = data.data.find((y: any) => y.is_active);
                if (active) setSelectedYear(active.id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStructures = async () => {
        if (!selectedClass || !selectedYear) return;
        try {
            const token = sessionStorage.getItem('hpc_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const res = await fetch(`/api/office/fees/structure?class_id=${selectedClass}&academic_year_id=${selectedYear}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setStructures(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching structures:', error);
        }
    };

    useEffect(() => {
        fetchStructures();
    }, [selectedClass, selectedYear]);

    const handleAddHead = async () => {
        if (!newHeadName) return;
        try {
            const token = sessionStorage.getItem('hpc_token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch('/api/office/fees/heads', {
                method: 'POST',
                headers,
                body: JSON.stringify({ head_name: newHeadName })
            });
            if (res.ok) {
                setNewHeadName('');
                fetchInitialData(); // Refresh heads
            } else {
                alert('Failed to add fee head');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddStructure = async () => {
        if (!selectedClass || !selectedYear || !selectedHead || !amount) {
            alert('Please fill all fields');
            return;
        }
        try {
            const token = sessionStorage.getItem('hpc_token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch('/api/office/fees/structure', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    class_id: parseInt(selectedClass),
                    academic_year_id: parseInt(selectedYear),
                    fee_head_id: parseInt(selectedHead),
                    amount: parseFloat(amount),
                    due_date: dueDate || null,
                    stream: stream || null,
                    subject_count: subjectCount ? parseInt(subjectCount) : null
                })
            });
            if (res.ok) {
                setAmount('');
                setDueDate('');
                setStream('');
                setSubjectCount('');
                fetchStructures();
            } else {
                alert('Failed to add fee structure');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div>Loading Configuration...</div>;

    return (
        <div className="space-y-8">
            {/* 1. Fee Heads Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Heads</h3>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="New Fee Head Name (e.g. Tuition Fee)"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={newHeadName}
                        onChange={(e) => setNewHeadName(e.target.value)}
                    />
                    <button
                        onClick={handleAddHead}
                        className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors"
                    >
                        Add Head
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {heads.map((head) => (
                        <div key={head.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-200">
                            {head.head_name}
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Fee Structure Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Structure (Assignments)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">Select Year</option>
                            {academicYears.map((y) => (
                                <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Active)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedClass && selectedYear && (
                    <div className="border-t pt-4">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Add Fee to Class</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Fee Head</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={selectedHead}
                                    onChange={(e) => setSelectedHead(e.target.value)}
                                >
                                    <option value="">Select Head</option>
                                    {heads.map((h) => (
                                        <option key={h.id} value={h.id}>{h.head_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Stream (Optional)</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={stream}
                                    onChange={(e) => setStream(e.target.value)}
                                >
                                    <option value="">All Streams</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Non-Medical">Non-Medical</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Humanities">Humanities</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Subj Count (Opt)</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={subjectCount}
                                    onChange={(e) => setSubjectCount(e.target.value)}
                                >
                                    <option value="">Any</option>
                                    <option value="5">5 Subjects</option>
                                    <option value="6">6 Subjects</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddStructure}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors h-10"
                            >
                                Assign Fee
                            </button>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">Current Structure</h4>
                            {structures.length === 0 ? (
                                <p className="text-gray-500 italic">No fees assigned to this class yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Head</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {structures.map((s) => (
                                                <tr key={s.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.head_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {s.stream && <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">{s.stream}</span>}
                                                        {s.subject_count && <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">{s.subject_count} Subj</span>}
                                                        {!s.stream && !s.subject_count && <span className="text-gray-400 text-xs">All Students</span>}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">₹{s.amount}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {s.due_date ? new Date(s.due_date).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
