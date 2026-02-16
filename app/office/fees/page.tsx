'use client';

import React, { useState } from 'react';
import FeeCollectionTab from './components/FeeCollectionTab';
import FeeConfigTab from './components/FeeConfigTab';
import DailyReportTab from './components/DailyReportTab';

export default function FeeManagementPage() {
    const [activeTab, setActiveTab] = useState<'collection' | 'config' | 'report'>('collection');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-800">Fee Management</h1>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('collection')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'collection' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Collect Fees
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Daily Report
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Configuration
                    </button>
                </div>
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'collection' && <FeeCollectionTab />}
                {activeTab === 'config' && <FeeConfigTab />}
                {activeTab === 'report' && <DailyReportTab />}
            </div>
        </div>
    );
}
