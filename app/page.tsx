'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
    const router = useRouter();

    const roles = [
        {
            id: 'admin',
            title: 'Admin',
            description: 'School Administration',
            icon: '🛡️',
            color: 'bg-indigo-600',
            path: '/login?role=admin' // Direct link to login with context
        },
        {
            id: 'office',
            title: 'Office',
            description: 'Fees & Student Data',
            icon: '💼',
            color: 'bg-emerald-600',
            path: '/login?role=office'
        },
        {
            id: 'teacher',
            title: 'Teacher',
            description: 'Class & Assessment',
            icon: '👨‍🏫',
            color: 'bg-blue-600',
            path: '/login?role=teacher'
        },
        {
            id: 'parent',
            title: 'Parent',
            description: 'Student Progress',
            icon: '👨‍👩‍👧‍👦',
            color: 'bg-purple-600',
            path: '/login?role=parent'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-10">
                <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                        src="/school_logo.png"
                        alt="School Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">SDMS EduPulse</h1>
                <p className="text-xl text-gray-600">Select your role to login</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                {roles.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => router.push(role.path)}
                        className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group hover:-translate-y-1"
                    >
                        <div className={`w-20 h-20 rounded-full ${role.color} text-white flex items-center justify-center text-4xl mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                            {role.icon}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{role.title}</h2>
                        <p className="text-gray-500 font-medium">{role.description}</p>
                        <div className="mt-6 text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Login as {role.title} →
                        </div>
                    </button>
                ))}
            </div>

            <footer className="mt-16 text-gray-400 text-sm">
                © {new Date().getFullYear()} School Management System. All rights reserved.
            </footer>
        </div>
    );
}
