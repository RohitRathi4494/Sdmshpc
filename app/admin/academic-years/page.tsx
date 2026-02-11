'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import Modal from '@/app/components/ui/Modal';

interface AcademicYear {
    id: number;
    year_name: string;
    is_active: boolean;
}

export default function AcademicYearsPage() {
    const router = useRouter();
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYearName, setNewYearName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchYears = async () => {
        try {
            const token = localStorage.getItem('hpc_token');
            const data = await ApiClient.get<AcademicYear[]>('/admin/academic-years', token || '');
            setYears(data);
        } catch (error) {
            console.error('Failed to fetch years:', error);
            alert('Failed to load academic years');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newYearName.trim()) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('hpc_token');
            await ApiClient.post('/admin/academic-years', { year_name: newYearName, is_active: false }, token || '');
            setNewYearName('');
            setIsModalOpen(false);
            fetchYears(); // Refresh list
        } catch (error: any) {
            alert(error.message || 'Failed to create year');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        if (currentStatus) return; // Already active, cannot deactivate (must activate another)

        if (!confirm('Are you sure you want to activate this academic year? This will deactivate all others.')) return;

        try {
            const token = localStorage.getItem('hpc_token');
            // PATCH endpoint we just created
            await ApiClient.request<{ id: number; is_active: boolean }>(`/admin/academic-years/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: true }),
                token: token || ''
            });
            fetchYears();
        } catch (error: any) {
            alert(error.message || 'Failed to update status');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="mr-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Academic Years</h1>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                    <span className="mr-2 text-xl">+</span> Add New Year
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : years.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No academic years found. Create one to get started.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {years.map((year) => (
                                <tr key={year.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{year.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{year.year_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${year.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {year.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {!year.is_active && (
                                            <button
                                                onClick={() => handleToggleActive(year.id, year.is_active)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Set Active
                                            </button>
                                        )}
                                        {year.is_active && <span className="text-gray-400 cursor-not-allowed">Current Active</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Academic Year">
                <form onSubmit={handleCreate}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Name (e.g. 2024-2025)</label>
                        <input
                            type="text"
                            required
                            value={newYearName}
                            onChange={(e) => setNewYearName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="YYYY-YYYY"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? 'Creating...' : 'Create Year'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
