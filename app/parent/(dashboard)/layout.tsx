'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem('hpc_token');
        const role = sessionStorage.getItem('hpc_role');
        if (!token || !role) {
            router.push('/parent/login');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('hpc_token');
        sessionStorage.removeItem('hpc_role');
        router.push('/parent/login');
    };

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">👨‍👩‍👧‍👦</span>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">SDMS EduPulse</h1>
                            <p className="text-xs text-blue-100">Parent Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors border border-blue-500"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-6">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-4 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} SDMS EduPulse. All rights reserved.
            </footer>
        </div>
    );
}
