'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';

interface ReportSetting {
    id?: number;
    report_type: string;
    is_published: boolean;
}

export default function ReportPublishSettingsPage() {
    const [settings, setSettings] = useState<ReportSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeYearId, setActiveYearId] = useState<number>(1);

    const reportOptions = [
        { label: 'Periodic Assessment 1 (PA1)', value: 'PA1' },
        { label: 'Terminal Assessment 1 (TA1)', value: 'TA1' },
        { label: 'Periodic Assessment 2 (PA2)', value: 'PA2' },
        { label: 'Terminal Assessment 2 (TA2)', value: 'TA2' },
        { label: 'Full Year HPC', value: 'FULL_HPC' },
        { label: 'Cumulative (Term 1 & 2)', value: 'CUMULATIVE' }
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                // 1. Fetch active year
                const yearRes = await ApiClient.get<any>('/admin/academic-years', token);
                const active = yearRes?.find((y: any) => y.is_active);
                let currentYearId = 1;

                if (active) {
                    currentYearId = active.id;
                    setActiveYearId(active.id);
                }

                // 2. Fetch settings
                const res = await fetch(`/api/admin/settings/reports?academic_year_id=${currentYearId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch settings');

                const data = await res.json();

                // Map DB settings or default to TRUE if not found (based on our seed logic)
                const mappedSettings = reportOptions.map(opt => {
                    const dbSet = data.data.find((d: any) => d.report_type === opt.value);
                    return dbSet ? { ...dbSet } : { report_type: opt.value, is_published: true };
                });

                setSettings(mappedSettings);
            } catch (err: any) {
                console.error(err);
                setError(`Failed to load report settings: ${err.message || String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const toggleSetting = async (reportType: string, currentStatus: boolean) => {
        setSaving(true);
        const newStatus = !currentStatus;

        // Optimistic update
        setSettings(prev => prev.map(s =>
            s.report_type === reportType ? { ...s, is_published: newStatus } : s
        ));

        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            const res = await fetch('/api/admin/settings/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    academic_year_id: activeYearId,
                    report_type: reportType,
                    is_published: newStatus
                })
            });

            if (!res.ok) throw new Error('Failed to update setting');
        } catch (err) {
            console.error(err);
            // Revert on error
            setSettings(prev => prev.map(s =>
                s.report_type === reportType ? { ...s, is_published: currentStatus } : s
            ));
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Publish Report Cards <span className="text-xs text-gray-400 font-normal">v2 (Updated)</span></h1>
            <p className="text-sm text-gray-500 mb-8">
                Toggle the switch to control which report cards are visible to parents in the Parent Dashboard for the current active Academic Year.
            </p>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
                {settings.map((setting) => {
                    const opt = reportOptions.find(o => o.value === setting.report_type);
                    return (
                        <div key={setting.report_type} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
                            <div>
                                <h3 className="font-semibold text-gray-800">{opt?.label || setting.report_type}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {setting.is_published
                                        ? "Currently visible to parents on the dashboard."
                                        : "Hidden. Parents cannot see this report type."}
                                </p>
                            </div>

                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={setting.is_published}
                                    onChange={() => toggleSetting(setting.report_type, setting.is_published)}
                                    disabled={saving}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    );
                })}
            </div>
            {saving && <p className="text-xs text-blue-600 font-medium text-center mt-4">Saving changes...</p>}
        </div>
    );
}
