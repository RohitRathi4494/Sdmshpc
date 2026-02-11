
import { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';

interface Subject {
    id: number;
    subject_name: string;
}

interface SubjectMasterProps {
    onUpdate: () => void;
}

export default function SubjectMaster({ onUpdate }: SubjectMasterProps) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            const data = await ApiClient.get<Subject[]>('/admin/subjects', token);
            setSubjects(data);
        } catch (error) {
            console.error('Failed to load subjects', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            await ApiClient.post('/admin/subjects', { subject_name: newName.trim() }, token);
            setNewName('');
            await fetchSubjects();
            onUpdate(); // Refresh parent options
        } catch (error: any) {
            alert(error.message || 'Failed to add subject');
        } finally {
            setAdding(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        try {
            const token = localStorage.getItem('hpc_token') || '';
            await ApiClient.put('/admin/subjects', { id, subject_name: editName.trim() }, token);
            setEditingId(null);
            await fetchSubjects();
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to update subject');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This cannot be undone if not assigned.')) return;
        try {
            const token = localStorage.getItem('hpc_token') || '';
            await ApiClient.request(`/admin/subjects?id=${id}`, { method: 'DELETE', token });
            await fetchSubjects();
            onUpdate();
        } catch (error: any) {
            alert(error.message || 'Failed to delete subject. It might be assigned to a class.');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Manage Subjects Master</h3>

            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter new subject name (e.g. Science)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                    {adding ? 'Adding...' : 'Add Subject'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4 text-gray-500">Loading subjects...</div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subjects.map(subject => (
                                <tr key={subject.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {editingId === subject.id ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 w-full"
                                                autoFocus
                                            />
                                        ) : (
                                            subject.subject_name
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === subject.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleUpdate(subject.id)} className="text-green-600 hover:text-green-900">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => { setEditingId(subject.id); setEditName(subject.subject_name); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                <button onClick={() => handleDelete(subject.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
