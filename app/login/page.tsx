'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Contextual Title
    const getRoleTitle = () => {
        switch (roleParam?.toLowerCase()) {
            case 'admin': return 'Admin Login';
            case 'teacher': return 'Teacher Login';
            case 'office': return 'Office Admin Login';
            case 'parent': return 'Parent Portal Login';
            default: return 'Sign In';
        }
    };

    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem('hpc_token');
        const role = localStorage.getItem('hpc_role');
        if (token && role) {
            if (role === 'ADMIN') router.push('/admin');
            else if (role === 'OFFICE') router.push('/office');
            else if (role === 'TEACHER') router.push('/teacher');
            else if (role === 'PARENT') router.push('/parent');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Login Successful
            localStorage.setItem('hpc_token', data.token);
            localStorage.setItem('hpc_role', data.role);
            localStorage.setItem('hpc_user', JSON.stringify(data.user)); // Store user info if useful

            // Redirect based on role
            if (data.role === 'ADMIN') {
                router.push('/admin');
            } else if (data.role === 'OFFICE') {
                router.push('/office');
            } else if (data.role === 'TEACHER') {
                router.push('/teacher');
            } else if (data.role === 'PARENT') {
                router.push('/parent'); // Assuming parent route
            } else {
                router.push('/admin'); // Fallback
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-4">
                    <Image
                        src="/school_logo.png"
                        alt="School Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-2xl font-bold text-blue-700">SDMS EduPulse</h1>
                <p className="text-gray-500 font-medium mt-2">{getRoleTitle()}</p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                    </label>
                    <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter username"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                    >
                        ← Back to Home
                    </button>
                </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
                {roleParam === 'admin' && (
                    <>
                        <p>Default Admin Credentials:</p>
                        <p>admin / admin</p>
                    </>
                )}
                {roleParam === 'office' && (
                    <>
                        <p>Default Office Credentials:</p>
                        <p>office / office123</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
