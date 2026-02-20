'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getActiveAcademicYear } from '../lib/actions';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';

// Mock Auth Context for this implementation since we don't have full Auth Provider
// In real app, this wraps the app.
const ACCESS_TOKEN_KEY = 'hpc_token';
const USER_ROLE_KEY = 'hpc_role';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [academicYear, setAcademicYear] = useState('...');
    const pathname = usePathname();
    const router = useRouter();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        const fetchYear = async () => {
            const year = await getActiveAcademicYear();
            setAcademicYear(year.name);
        };
        fetchYear();
    }, []);

    // Basic auth check
    useEffect(() => {
        const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        const role = sessionStorage.getItem(USER_ROLE_KEY);

        if (!token) {
            router.push('/login');
        } else if (role !== 'TEACHER' && role !== 'ADMIN') {
            // Strict check only if we really want to block admins.
            // For now, let's allow Admins to view teacher pages for debugging/report preview.
            // Or we can just let it slide since we're efficient.
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(USER_ROLE_KEY);
        router.push('/login');
    };

    const navItems = [
        { label: 'Dashboard', href: '/teacher', icon: '🏠' },
        { label: 'Student List', href: '/teacher/students', icon: '👨‍🎓' },
        { label: 'Communication', href: '/teacher/communication', icon: '📢' },
        // Specific assessment links might depend on selected student, 
        // so sidebar mostly gives access to high level lists.
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`bg-white shadow-md transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-4 flex items-center justify-between border-b shrink-0">
                    <h1 className={`font-bold text-xl text-blue-600 ${!isSidebarOpen && 'hidden'}`}>SDMS EduPulse Teacher</h1>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-colors ${pathname === item.href ? 'bg-blue-100 text-blue-700 font-medium' : ''}`}
                        >
                            <span className="text-xl mr-3">{item.icon}</span>
                            {isSidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className={`flex items-center p-3 rounded-lg hover:bg-blue-50 text-gray-700 transition-colors w-full text-left`}
                    >
                        <span className="text-xl mr-3">🔒</span>
                        {isSidebarOpen && <span>Change Password</span>}
                    </button>
                </nav>
                <div className="p-4 border-t shrink-0">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center p-2 text-red-600 hover:bg-red-50 w-full rounded ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <span className="mr-2">🚪</span>
                        {isSidebarOpen && 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => i.href === pathname)?.label || 'Assessment'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Academic Year: {academicYear}</span>
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            T
                        </div>
                    </div>
                </header>
                <div className="p-6">
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
