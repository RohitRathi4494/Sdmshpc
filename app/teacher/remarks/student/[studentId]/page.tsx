'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

// Hardcoded Remark Types matching Seed
const REMARK_TYPES = [
    { id: 1, name: 'Learner’s Profile by the teacher', hasAspect: false },
    {
        id: 2, name: 'Parent’s Feedback', hasAspect: true, aspects: [
            'My child enjoys participating in...',
            'My child can be supported for...',
            'Any additional observations'
        ]
    },
    {
        id: 3, name: 'Self-Assessment', hasAspect: true, aspects: [
            'Activities I enjoy the most',
            'Activities I find challenging',
            'Activities I enjoy doing with my friends'
        ]
    },
];

export default function RemarksEntryPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const [remarks, setRemarks] = useState<Record<string, string>>({});
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('hpc_token') || undefined;
                const report = await ApiClient.get<any>(`/reports/student/${studentId}?academic_year_id=1`, token);
                setStudentName(report.student.student_name);

                const remMap: Record<string, string> = {};
                report.remarks.forEach((r: any) => {
                    const key = r.aspect ? `${r.remark_type_id}-${r.aspect}` : `${r.remark_type_id}`;
                    remMap[key] = r.remark_text;
                });
                setRemarks(remMap);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    const handleChange = async (typeId: number, aspect: string | null, text: string) => {
        const key = aspect ? `${typeId}-${aspect}` : `${typeId}`;
        setRemarks(prev => ({ ...prev, [key]: text }));

        // Debounce save? 
        // For specific text inputs, usually better to save on Blur.
        // I'll add onBlur handler to the textarea/input instead of saving on every keystroke.
    };

    const handleBlur = async (typeId: number, aspect: string | null, text: string) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('hpc_token') || undefined;
            await ApiClient.post('/teacher/remarks', {
                student_id: studentId,
                remark_type_id: typeId,
                aspect: aspect,
                remark_text: text,
                academic_year_id: 1
            }, token);
            setSaving(false);
        } catch {
            setSaving(false);
        }
    };

    const router = useRouter();

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => router.back()}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{studentName} - Remarks</h2>

            <div className="space-y-6">
                {REMARK_TYPES.map(type => (
                    <div key={type.id} className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{type.name}</h3>

                        {!type.hasAspect ? (
                            <textarea
                                className="w-full border rounded p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Enter remarks..."
                                value={remarks[`${type.id}`] || ''}
                                onChange={(e) => handleChange(type.id, null, e.target.value)}
                                onBlur={(e) => handleBlur(type.id, null, e.target.value)}
                            />
                        ) : (
                            <div className="space-y-4">
                                {type.aspects?.map(aspect => (
                                    <div key={aspect}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{aspect}</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={remarks[`${type.id}-${aspect}`] || ''}
                                            onChange={(e) => handleChange(type.id, aspect, e.target.value)}
                                            onBlur={(e) => handleBlur(type.id, aspect, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
