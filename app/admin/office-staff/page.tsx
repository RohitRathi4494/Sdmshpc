'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/app/components/ui/Modal';

interface StaffMember {
    id: number;
    username: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
}

const token = () => sessionStorage.getItem('hpc_token') || '';
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

export default function OfficeStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<StaffMember | null>(null);
    const [formData, setFormData] = useState({ username: '', full_name: '', password: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/office-staff', { headers: authHeaders() });
            const json = await res.json();
            if (json.success) setStaff(json.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const openAdd = () => {
        setEditing(null);
        setFormData({ username: '', full_name: '', password: '', is_active: true });
        setError('');
        setIsModalOpen(true);
    };

    const openEdit = (s: StaffMember) => {
        setEditing(s);
        setFormData({ username: s.username, full_name: s.full_name, password: '', is_active: s.is_active });
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            let res: Response;
            if (editing) {
                const payload: any = { full_name: formData.full_name, is_active: formData.is_active };
                if (formData.password) payload.password = formData.password;
                res = await fetch(`/api/admin/office-staff/${editing.id}`, {
                    method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/admin/office-staff', {
                    method: 'POST', headers: authHeaders(),
                    body: JSON.stringify({ username: formData.username, full_name: formData.full_name, password: formData.password }),
                });
            }
            const json = await res.json();
            if (!json.success) { setError(json.message || 'Failed to save'); return; }
            setIsModalOpen(false);
            fetchStaff();
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const filtered = staff.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Office Staff</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage login accounts for office staff</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                    <span className="text-lg">+</span> Add Staff
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or username…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="text-3xl mb-2">🏢</div>
                        <p className="text-gray-500 text-sm">{staff.length === 0 ? 'No office staff accounts yet. Click "Add Staff" to create one.' : 'No matches found.'}</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Full Name', 'Username', 'Status', 'Created', 'Actions'].map((h, i) => (
                                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold uppercase">
                                                {s.full_name[0]}
                                            </div>
                                            {s.full_name}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 font-mono">{s.username}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                                            {s.is_active ? '● Active' : '● Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                                    <td className="px-5 py-3 text-right">
                                        <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Staff Member' : 'Add Office Staff'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" required value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" required disabled={!!editing} value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            placeholder="e.g. office_staff1"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100"
                        />
                        {editing && <p className="text-xs text-gray-400 mt-1">Username cannot be changed.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editing ? 'New Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <input type="password" required={!editing} value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {editing && (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Account Active</span>
                        </label>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50">
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
