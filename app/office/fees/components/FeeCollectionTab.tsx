'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeeCollectionTab() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all students (or filter)
    // Ideally this should use the search API with debounce, but for MVP we fetch all and filter client side 
    // OR fetch on button click. Let's do fetch on mount/button for now.

    // Fetch active year and students
    const handleSearch = async () => {
        setLoading(true);
        try {
            // 1. Get Active Academic Year
            const yearRes = await fetch('/api/admin/academic-years');
            if (!yearRes.ok) throw new Error('Failed to fetch academic years');
            const yearData = await yearRes.json();
            const activeYear = yearData.data.find((y: any) => y.is_active);

            if (!activeYear) {
                alert('No active academic year found. Please set one in settings.');
                setLoading(false);
                return;
            }

            // 2. Fetch Students for Active Year
            const allRes = await fetch(`/api/admin/students?academic_year_id=${activeYear.id}&status=enrolled`);

            if (allRes.ok) {
                const data = await allRes.json();
                let filtered = data.data;
                if (search) {
                    const lower = search.toLowerCase();
                    filtered = filtered.filter((s: any) =>
                        s.student_name.toLowerCase().includes(lower) ||
                        s.admission_no.toLowerCase().includes(lower) ||
                        (s.father_name && s.father_name.toLowerCase().includes(lower))
                    );
                }
                setStudents(filtered);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || 'Unknown error occurred fetching students'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);

    // Auto-search on mount?
    // Let's rely on user typing + button for now to avoid complexity without active year context.
    // Actually, getting active year ID is important.

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Collection</h3>

            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by Name or Admission No..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    {loading ? 'Loading...' : 'No students found. Search to begin.'}
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.admission_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.student_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.class_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.father_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => router.push(`/office/student/${student.id}/fees`)}
                                            className="text-emerald-600 hover:text-emerald-900 font-semibold"
                                        >
                                            Collect Fees →
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
