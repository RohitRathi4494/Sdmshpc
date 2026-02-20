'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ParentLoginPage() {
    const router = useRouter();
    const [admissionNo, setAdmissionNo] = useState('');
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/parent/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admission_no: admissionNo, dob }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Login Successful
            sessionStorage.setItem('hpc_token', data.token);
            sessionStorage.setItem('hpc_role', 'PARENT');
            router.push('/parent');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-blue-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-20 h-20 mb-3">
                        <Image
                            src="/school_logo.png"
                            alt="School Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Parent Portal</h1>
                    <p className="text-gray-500 text-sm">Access your child's progress</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Admission Number
                        </label>
                        <input
                            type="text"
                            required
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="e.g. ADM12345"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date of Birth (DDMMYYYY)
                        </label>
                        <input
                            type="text"
                            required
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="e.g. 15082015"
                            maxLength={8}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">Format: DDMMYYYY</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
                            }`}
                    >
                        {loading ? 'Verifying...' : 'Access Portal'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t pt-4">
                    <p className="text-xs text-gray-500">
                        SDMS EduPulse &bull; Parent Access
                    </p>
                </div>
            </div>
        </div>
    );
}
