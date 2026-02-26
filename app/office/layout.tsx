'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';

const ACCESS_TOKEN_KEY = 'hpc_token';
const USER_ROLE_KEY = 'hpc_role';

// ─── Feature flag ────────────────────────────────────────────────────────────
// Set to true when the office portal is ready to use again.
const OFFICE_PORTAL_ENABLED = false;
// ─────────────────────────────────────────────────────────────────────────────

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem('hpc_token');
        const role = sessionStorage.getItem('hpc_role');
        if (!token || (role !== 'OFFICE' && role !== 'ADMIN')) {
            router.push('/login');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // ── Portal disabled screen ──────────────────────────────────────────────
    if (!OFFICE_PORTAL_ENABLED) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-lg max-w-md w-full text-center p-10">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Office Portal Unavailable</h1>
                    <p className="text-slate-500 text-sm mb-6">
                        The Office Portal and Fee Management module are temporarily disabled.<br />
                        Please contact the system administrator for more information.
                    </p>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
                            sessionStorage.removeItem(USER_ROLE_KEY);
                            router.push('/login');
                        }}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>
        );
    }
    // ────────────────────────────────────────────────────────────────────────

    const navItems = [
        { label: 'Dashboard', href: '/office', icon: '📊' },
        { label: 'Student Management', href: '/office/students', icon: '👨‍🎓' },
        { label: 'Fee Management', href: '/office/fees', icon: '💰' },
        // { label: 'Reports', href: '/office/reports', icon: '📄' }, // Implementation later
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`bg-slate-800 text-white shadow-xl transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-4 flex items-center justify-between border-b border-slate-700 shrink-0">
                    <h1 className={`font-bold text-lg text-emerald-400 ${!isSidebarOpen && 'hidden'}`}>Office Portal</h1>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-700 rounded text-gray-400">
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center p-3 rounded-lg hover:bg-slate-700 transition-colors ${pathname === item.href ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-300'}`}
                        >
                            <span className="text-xl mr-3">{item.icon}</span>
                            {isSidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className={`flex items-center p-3 rounded-lg hover:bg-slate-700 text-gray-300 transition-colors w-full text-left`}
                    >
                        <span className="text-xl mr-3">🔒</span>
                        {isSidebarOpen && <span>Change Password</span>}
                    </button>
                </nav>
                <div className="p-4">
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('hpc_token');
                            sessionStorage.removeItem('hpc_role');
                            router.push('/login');
                        }}
                        className={`flex items-center p-2 text-red-300 hover:bg-slate-700 w-full rounded ${!isSidebarOpen && 'justify-center'}`}
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
                        {navItems.find(i => i.href === pathname)?.label || 'Office Administration'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wide">
                            Office Mode
                        </div>
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            O
                        </div>
                    </div>
                </header>
                <div className="p-6 flex-1">
                    {children}
                </div>
            </main>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
}
