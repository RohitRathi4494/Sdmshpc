'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ username: '', full_name: '', password: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        const role = sessionStorage.getItem('hpc_role');
        if (role !== 'SUPER_ADMIN') {
            router.push('/admin'); // Redirect if not Super Admin
            return;
        }
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('hpc_token');
            const response = await fetch('/api/superadmin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to fetch system users');
            }

            setUsers(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            full_name: user.full_name,
            password: '',
            is_active: user.is_active
        });
        setModalError('');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError('');
        setSuccessMessage('');

        try {
            const token = sessionStorage.getItem('hpc_token');
            const res = await fetch('/api/superadmin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: editingUser.id,
                    username: editForm.username,
                    full_name: editForm.full_name,
                    password: editForm.password,
                    is_active: editForm.is_active
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error updating user');
            }

            setSuccessMessage(`User ${editForm.full_name} updated successfully.`);
            setIsModalOpen(false);
            fetchUsers(); // Refresh list

        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading system users...</div>;

    // Group users by School
    const groupedUsers = users.reduce((acc: any, user: any) => {
        const key = `${user.school_name} (${user.school_code})`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(user);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2 text-3xl">🌐</span> Manage Branches & Administrators
            </h1>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 shadow">{error}</div>}
            {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 shadow">{successMessage}</div>}

            <div className="space-y-8">
                {Object.keys(groupedUsers).map((schoolName, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow overflow-hidden border">
                        <div className="bg-gray-100 px-6 py-4 border-b">
                            <h2 className="text-lg font-bold text-gray-800">{schoolName}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Username</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {groupedUsers[schoolName].map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{user.full_name}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono bg-gray-50 rounded px-2">{user.username}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="text-sm font-medium text-green-600 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Active</span>
                                                ) : (
                                                    <span className="text-sm font-medium text-red-600 flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 font-medium transition-colors text-sm border border-indigo-200"
                                                >
                                                    Edit Credentials
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {users.length === 0 && !error && (
                    <div className="text-center py-12 bg-white rounded-xl border">
                        <span className="text-4xl">🏢</span>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Branch Admins Found</h3>
                        <p className="mt-1 text-gray-500">There are no ADMIN or OFFICE users in any branch.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Edit User ({editingUser.school_code})</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>

                        {modalError && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm border border-red-200">{modalError}</div>}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border font-mono"
                                    value={editForm.username}
                                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                                <input
                                    type="password"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                    value={editForm.password}
                                    onChange={e => setEditForm({...editForm, password: e.target.value})}
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters if changing</p>
                            </div>

                            <div className="flex items-center mt-4 bg-gray-50 p-3 rounded border">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    checked={editForm.is_active}
                                    onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">
                                    Account is Active (Can Login)
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
