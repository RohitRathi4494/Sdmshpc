'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notice {
    id: number;
    title: string;
    content: string;
    created_at: string;
    recipient_count: number;
}

interface ClassOption {
    id: number;
    class_name: string;
}

export default function CommunicationPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose');
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [recipientType, setRecipientType] = useState<'CLASS' | 'STUDENT'>('CLASS');
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
    // For now we will implement Class-wise sending first as it's the most common use case
    // Student-wise would require a searchable dropdown which is more complex

    useEffect(() => {
        if (activeTab === 'sent') {
            fetchSentNotices();
        } else {
            fetchClasses();
        }
    }, [activeTab]);

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/admin/classes'); // Using existing API
            if (res.ok) {
                const data = await res.json();
                setClasses(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSentNotices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notices/sent', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotices(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching notices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId && recipientType === 'CLASS') {
            alert("Please select a class");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const recipients = [];

            if (recipientType === 'CLASS') {
                recipients.push({ type: 'CLASS', recipient_id: Number(selectedClassId) });
            }

            const res = await fetch('/api/notices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    recipients
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Notice sent successfully!");
                setTitle('');
                setContent('');
                setSelectedClassId('');
                setActiveTab('sent'); // Switch to sent view
            } else {
                alert(`Error: ${data.message}`);
            }

        } catch (error) {
            console.error("Error sending notice:", error);
            alert("Failed to send notice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Communication Center</h1>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'compose' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('compose')}
                >
                    Compose Notice
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'sent' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('sent')}
                >
                    Sent History
                </button>
            </div>

            {/* Compose View */}
            {activeTab === 'compose' && (
                <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
                    <form onSubmit={handleSend}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Notice Title</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
                                placeholder="e.g., Annual Sports Day"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Recipient Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="rtype"
                                        value="CLASS"
                                        checked={recipientType === 'CLASS'}
                                        onChange={() => setRecipientType('CLASS')}
                                        className="mr-2"
                                    />
                                    Target Entire Class
                                </label>
                                {/* Future: Add Student Option 
                                <label className="flex items-center text-gray-400 cursor-not-allowed">
                                    <input type="radio" name="rtype" value="STUDENT" disabled className="mr-2" />
                                    Target Specific Student (Coming Soon)
                                </label>
                                */}
                            </div>
                        </div>

                        {recipientType === 'CLASS' && (
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">Select Class</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">-- Choose Class --</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.class_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">Message Content</label>
                            <textarea
                                className="w-full border p-2 rounded h-32 focus:ring focus:ring-blue-200"
                                placeholder="Type your message here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${loading ? 'opacity-50' : ''}`}
                        >
                            {loading ? 'Sending...' : 'Send Notice'}
                        </button>
                    </form>
                </div>
            )}

            {/* Sent History View */}
            {activeTab === 'sent' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 border-b font-semibold text-gray-700">Date</th>
                                <th className="p-4 border-b font-semibold text-gray-700">Title</th>
                                <th className="p-4 border-b font-semibold text-gray-700">Content Preview</th>
                                <th className="p-4 border-b font-semibold text-gray-700">Recipients</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                            ) : notices.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">No notices sent yet.</td></tr>
                            ) : (
                                notices.map(notice => (
                                    <tr key={notice.id} className="hover:bg-gray-50">
                                        <td className="p-4 border-b text-sm text-gray-600">
                                            {new Date(notice.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 border-b font-medium text-blue-600">{notice.title}</td>
                                        <td className="p-4 border-b text-gray-600 truncate max-w-xs">{notice.content.substring(0, 50)}...</td>
                                        <td className="p-4 border-b text-sm">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {notice.recipient_count} recipients
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
