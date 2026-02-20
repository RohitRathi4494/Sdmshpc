'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notice {
    id: number;
    title: string;
    content: string;
    created_at: string;
    sender_name: string;
}

export default function NoticesPage() {
    const router = useRouter();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token');
                if (!token) {
                    router.push('/parent/login');
                    return;
                }

                const res = await fetch('/api/parent/notices', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setNotices(data.data || []);
                } else if (res.status === 401) {
                    localStorage.removeItem('hpc_parent_token');
                    router.push('/parent/login');
                }
            } catch (error) {
                console.error("Error fetching notices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, [router]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading notices...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">School Notices & Circulars</h1>
            </div>

            <div className="space-y-6">
                {notices.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500">No notices found.</p>
                    </div>
                ) : (
                    notices.map((notice, idx) => (
                        <div key={notice.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{notice.title}</h2>
                                    <p className="text-xs text-gray-400 mt-1">
                                        From: <span className="font-medium text-gray-600">{notice.sender_name || 'Admin'}</span>
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    {new Date(notice.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">{notice.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
