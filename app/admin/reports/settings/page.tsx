'use client';

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';

interface ReportSetting {
    id?: number;
    report_type: string;
    is_published: boolean;
    published_classes: number[];
}

export default function ReportPublishSettingsPageV4() {
    const [settings, setSettings] = useState<ReportSetting[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
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
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
                }

                const data = await res.json();

                // 3. Fetch all classes
                const classesRes = await ApiClient.get<any>('/admin/classes', token);
                setClasses(classesRes || []);

                // Map DB settings or default to TRUE if not found (based on our seed logic)
                const mappedSettings = reportOptions.map(opt => {
                    const dbSet = data.data.find((d: any) => d.report_type === opt.value);
                    return dbSet ? { ...dbSet, published_classes: dbSet.published_classes || [] } : { report_type: opt.value, is_published: true, published_classes: classesRes.map((c: any) => c.id) };
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
        const currentSetting = settings.find(s => s.report_type === reportType);

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
                    is_published: newStatus,
                    published_classes: currentSetting?.published_classes || []
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

    const toggleClass = async (reportType: string, classId: number, isSelected: boolean) => {
        setSaving(true);
        const currentSetting = settings.find(s => s.report_type === reportType);
        if (!currentSetting) return;

        let newClasses = [...(currentSetting.published_classes || [])];
        if (isSelected) {
            newClasses = newClasses.filter(id => id !== classId);
        } else {
            newClasses.push(classId);
        }

        // Optimistic update
        setSettings(prev => prev.map(s =>
            s.report_type === reportType ? { ...s, published_classes: newClasses } : s
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
                    is_published: currentSetting.is_published,
                    published_classes: newClasses
                })
            });

            if (!res.ok) throw new Error('Failed to update setting');
        } catch (err) {
            console.error(err);
            // Revert on error
            setSettings(prev => prev.map(s =>
                s.report_type === reportType ? { ...s, published_classes: currentSetting.published_classes } : s
            ));
            alert('Failed to save class permissions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Publish Report Cards <span className="text-xs text-blue-500 font-normal">v4 (Class-wise)</span></h1>
            <p className="text-sm text-gray-500 mb-8">
                Toggle the master switch to enable a report type, and select exactly which classes are allowed to view it in the Parent Dashboard.
            </p>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6">{error}</div>}

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
                {settings.map((setting) => {
                    const opt = reportOptions.find(o => o.value === setting.report_type);
                    return (
                        <div key={setting.report_type} className="p-6 transition-colors group">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{opt?.label || setting.report_type}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {setting.is_published
                                            ? "Master Switch ON. Manage specific classes below."
                                            : "Master Switch OFF. Completely hidden from all parents."}
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

                            {/* Class Selection Grid - Only shown if Master Switch is ON */}
                            {setting.is_published && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Allowed Classes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {classes.map(cls => {
                                            const isSelected = setting.published_classes?.includes(cls.id);
                                            return (
                                                <button
                                                    key={cls.id}
                                                    onClick={() => toggleClass(setting.report_type, cls.id, isSelected)}
                                                    disabled={saving}
                                                    className={`px-3 py-1.5 text-sm rounded-md border transition-all ${isSelected
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {cls.class_name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {(!setting.published_classes || setting.published_classes.length === 0) && (
                                        <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded inline-block">No classes selected. This report will not be visible to anyone.</p>
                                    )}
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
            {saving && <p className="text-xs text-blue-600 font-medium text-center mt-4">Saving changes...</p>}
        </div>
    );
}
