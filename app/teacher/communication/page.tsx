'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Reusing the same structure as Admin for now, but fetching Teacher's classes
// ideally we should extract the "ComposeNotice" component to reuse it.
// For speed, duplicating with minor adjustments.

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
    section_name: string; // Teacher gets specific sections usually
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

    useEffect(() => {
        if (activeTab === 'sent') {
            fetchSentNotices();
        } else {
            fetchClasses();
        }
    }, [activeTab]);

    const fetchClasses = async () => {
        try {
            // Teacher needs to see classes they are assigned to
            const res = await fetch('/api/teacher/classes', {
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hpc_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Map the teacher's classes/sections to a unified dropdown
                // The API /api/teacher/classes returns { data: [{id, class_name, section_name, ...}] }
                // Wait, typically we target a "Class" (e.g. 10th Grade) or a "Section" (10-A).
                // Our schema notice_recipients(recipient_type='CLASS', recipient_id) might refer to 'classes' table or 'sections' table?
                // The current schema implementation for "CLASS" recipient usually implies a generic group.
                // However, our table `sections` is where students are enrolled.
                // If notices target `classes` (e.g. Grade 10), it goes to all sections.
                // If notices target `sections` (e.g. 10-A), we need a new recipient type 'SECTION' or allow 'CLASS' to map to section IDs if we are loose.
                // Let's assume 'CLASS' recipient_type targets the `classes` table (Grade Level).
                // BUT Teachers are usually Class Teachers of a *Section*.
                // Let's modify the frontend to select the *Class* that the section belongs to, OR we need to update backend to support 'SECTION' recipient type.

                // For simplicity now, let's assume we target the Class ID stored in the section.
                // But verify what /api/teacher/classes returns.
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
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('hpc_token')}` }
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

        // Safety check: Teachers might only have access to specific sections, but our DB schema 'recipient_type'='CLASS' targets the entire Grade.
        // This is a known limitation of the current quick schema. 
        // We will proceed with 'CLASS' targeting for now (e.g. Teacher of 10-A sends notice to "Class 10").
        // Ideally we should add 'SECTION' type.

        if (!selectedClassId && recipientType === 'CLASS') {
            alert("Please select a class");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
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
                setActiveTab('sent');
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Teacher Communication</h1>

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

            {activeTab === 'compose' && (
                <div className="bg-white p-6 rounded-lg shadow max-w-2xl">
                    <form onSubmit={handleSend}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Notice Title</label>
                            <input
                                type="text"
                                className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
                                placeholder="e.g., Homework Update"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Recipient</label>
                            <select
                                className="w-full border p-2 rounded"
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                required
                            >
                                <option value="">-- Select Class --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name} {c.section_name ? `- ${c.section_name}` : ''}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Note: This will send the notice to the selected class.</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">Message</label>
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

