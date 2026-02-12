'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ACCESS_TOKEN_KEY = 'hpc_token';
const USER_ROLE_KEY = 'hpc_role';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const role = localStorage.getItem(USER_ROLE_KEY);

        if (!token || role !== 'ADMIN') {
            router.push('/login');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) {
        return null; // Don't render anything while checking auth
    }

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: '📊' },
        { label: 'Academic Years', href: '/admin/academic-years', icon: '📅' },
        { label: 'Classes & Sections', href: '/admin/classes', icon: '🏫' },
        { label: 'Subject Mapping', href: '/admin/subjects', icon: '📚' },
        { label: 'Manage Teachers', href: '/admin/teachers', icon: '👨‍🏫' },
        { label: 'Student Management', href: '/admin/students', icon: '👨‍🎓' },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`bg-gray-900 text-white shadow-xl transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-4 flex items-center justify-between border-b border-gray-700">
                    <h1 className={`font-bold text-xl text-indigo-400 ${!isSidebarOpen && 'hidden'}`}>SDMS EduPulse Admin</h1>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-700 rounded text-gray-400">
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors ${pathname === item.href ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300'}`}
                        >
                            <span className="text-xl mr-3">{item.icon}</span>
                            {isSidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="p-4">
                    <button
                        onClick={() => {
                            localStorage.removeItem(ACCESS_TOKEN_KEY);
                            localStorage.removeItem(USER_ROLE_KEY);
                            router.push('/login');
                        }}
                        className={`flex items-center p-2 text-red-400 hover:bg-gray-800 w-full rounded ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <span className="mr-2">🚪</span>
                        {isSidebarOpen && 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => i.href === pathname)?.label || 'System Administration'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold uppercase tracking-wide">
                            Admin Mode
                        </div>
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </header>
                <div className="p-6 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
