'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';

interface StatsData {
    totalStudents: number | string;
    totalClasses: number | string;
    totalTeachers: number | string;
}

export default function DashboardQuickStats({ initialSession }: { initialSession: string }) {
    const [stats, setStats] = useState<StatsData>({
        totalStudents: '--',
        totalClasses: '--',
        totalTeachers: '--'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                const response = await ApiClient.get<{ success: boolean; data: StatsData }>('/admin/stats', token);
                
                if (response && response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <span className="block text-3xl font-bold text-indigo-600">
                        {loading ? <span className="animate-pulse">...</span> : stats.totalStudents}
                    </span>
                    <span className="text-sm text-gray-500">Total Students</span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <span className="block text-3xl font-bold text-indigo-600">
                        {loading ? <span className="animate-pulse">...</span> : stats.totalClasses}
                    </span>
                    <span className="text-sm text-gray-500">Active Classes</span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <span className="block text-3xl font-bold text-indigo-600">{initialSession}</span>
                    <span className="text-sm text-gray-500">Current Session</span>
                </div>
            </div>
        </div>
    );
}
