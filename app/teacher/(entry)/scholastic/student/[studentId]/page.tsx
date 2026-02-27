'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

// Types matching backend
interface StudentReport {
    scholastic: any[];
    subjects?: any[]; // Added
    student: {
        id: number;
        student_name: string;
        admission_no: string;
        class_name: string;
        section_name: string;
    };
}

interface ScholasticScore {
    student_id: number;
    subject_id: number;
    component_id: number;
    term_id: number;
    // grade removed
    marks?: number | null;
    academic_year_id: number;
}

interface AssessmentComponent {
    id: number;
    component_name: string;
    max_marks: number;
}

const SUBJECTS_ORDER = [
    'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'ICT', 'Sanskrit', 'General Knowledge'
];

const TERMS = [
    { id: 1, name: 'Term I' },
    { id: 2, name: 'Term II' },
];

const COMPONENT_MAX_MARKS: Record<string, number> = {
    'Periodic Assessment': 30,
    'Subject Enrichment Activities': 5,
    'Internal Assessment': 5,
    'Terminal Assessment': 60
};

export default function ScholasticEntryPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const router = useRouter();

    const [reportData, setReportData] = useState<StudentReport | null>(null);
    const [scores, setScores] = useState<Record<string, ScholasticScore>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null); // New state for fetch errors
    const [subjects, setSubjects] = useState<any[]>([]);
    const [components, setComponents] = useState<AssessmentComponent[]>([]);

    // ... (useEffect remains same) ...
    useEffect(() => {
        const loadData = async () => {
            try {
                setFetchError(null);
                const token = sessionStorage.getItem('hpc_token') || undefined;

                const [report, componentsData] = await Promise.all([
                    ApiClient.get<StudentReport>(`/reports/student/${studentId}?academic_year_id=1`, token),
                    ApiClient.get<AssessmentComponent[]>('/teacher/assessment-components', token)
                ]);

                // console.log('Components Data:', componentsData); // Debug log removed
                setReportData(report);
                setComponents(componentsData);

                // Transform array to map for O(1) access
                const scoreMap: Record<string, ScholasticScore> = {};
                if (report.scholastic) {
                    report.scholastic.forEach((s: any) => {
                        const key = `${s.subject_id}-${s.component_id}-${s.term_id}`;
                        scoreMap[key] = s;
                    });
                }
                setScores(scoreMap);

                // Use subjects from API
                if (report.subjects && report.subjects.length > 0) {
                    // sort to ensure consistent order (optional, API already sorts by name)
                    setSubjects(report.subjects);
                } else {
                    // Fallback to hardcoded only if API returns nothing (legacy behavior)
                    const subjectList = SUBJECTS_ORDER.map((name, idx) => ({ id: idx + 1, name }));
                    setSubjects(subjectList);
                }

            } catch (error: any) {
                console.error('Failed to load data', error);
                setFetchError(error.message || 'Failed to load data. Please try refreshing.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    // Upsert Handler
    const handleScoreChange = useCallback(async (
        subjectId: number,
        componentId: number,
        termId: number,
        field: 'grade' | 'marks',
        value: string | number
    ) => {
        setSaveError(null); // Clear previous error

        // Validation for marks
        if (field === 'marks') {
            const component = components.find(c => c.id === componentId);
            if (component && typeof value === 'number') {
                const maxMarks = COMPONENT_MAX_MARKS[component.component_name] || component.max_marks;
                if (value < 0 || value > maxMarks) {
                    alert(`Marks for ${component.component_name} must be between 0 and ${maxMarks}`);
                    return;
                }
            }
        }

        const key = `${subjectId}-${componentId}-${termId}`;
        const current = scores[key] || {
            student_id: studentId,
            subject_id: subjectId,
            component_id: componentId,
            term_id: termId,
            // grade removed
            marks: null,
            academic_year_id: 1 // Default
        };

        // Optimistic Update
        const updated = { ...current, [field]: value };
        setScores(prev => ({ ...prev, [key]: updated }));
        setSaving(true);

        try {
            const token = sessionStorage.getItem('hpc_token') || undefined;
            await ApiClient.post('/teacher/scholastic-scores', updated, token);
            setSaving(false);
        } catch (error: any) {
            console.error('Save failed', error);
            setSaveError(error.message || 'Failed to save changes!');
            setSaving(false);
        }
    }, [scores, studentId, components]);

    if (loading) return <div className="p-8 text-center">Loading assessment data...</div>;

    if (fetchError) {
        return (
            <div className="p-8 text-center text-red-600">
                <p className="font-bold text-lg mb-2">Error Loading Data</p>
                <p>{fetchError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!reportData) return <div className="p-8 text-center text-red-600">Student data not found.</div>;

    return (
        <div className="max-w-full mx-auto">

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Scholastic Marks Entry</h2>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-amber-600 animate-pulse text-sm font-medium">● Saving...</span>}
                    {saveError && <span className="text-red-600 text-xs bg-red-50 px-2 py-1 rounded">⚠ {saveError}</span>}
                    {!saving && !saveError && <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">✓ Auto-saved</span>}
                </div>
            </div>
            <div className="overflow-x-auto shadow rounded-lg border bg-white mb-10">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 w-48">
                                Subjects
                            </th>
                            {components.map(comp => (
                                <th key={comp.id} colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                    {comp.component_name} <br />
                                    <span className="text-gray-400 font-normal">({COMPONENT_MAX_MARKS[comp.component_name] || comp.max_marks} Marks)</span>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {components.map(comp => (
                                <React.Fragment key={comp.id}>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-gray-50">Term I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-gray-50">Term II</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map(subject => (
                            <tr key={subject.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r sticky left-0 bg-white z-10">
                                    {subject.subject_name || subject.name}
                                </td>
                                {components.map(comp => (
                                    <React.Fragment key={comp.id}>
                                        {TERMS.map(term => {
                                            const key = `${subject.id}-${comp.id}-${term.id}`;
                                            const score = scores[key] || {};
                                            return (
                                                <td key={term.id} className="px-2 py-2 border-r min-w-[100px] text-center">
                                                    <input
                                                        type="number"
                                                        placeholder=""
                                                        className="block w-20 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 mx-auto text-center"
                                                        value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Convert to float, or null if empty
                                                            let numVal: number | string = ''; // Keep as string '' for input field
                                                            if (val !== '') {
                                                                numVal = parseFloat(val);
                                                            }
                                                            // Pass parsed number or empty string to handler.
                                                            // HandleScoreChange takes string | number.
                                                            handleScoreChange(subject.id, comp.id, term.id, 'marks', numVal);
                                                        }}
                                                        max={COMPONENT_MAX_MARKS[comp.component_name] || comp.max_marks}
                                                        min={0}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-blue-50 text-blue-800 rounded mb-8 text-sm">
                <p className="font-bold">Assessment Structure:</p>
                <ul className="list-disc ml-5 mt-1">
                    {components.map(c => (
                        <li key={c.id}>{c.component_name}: Max {COMPONENT_MAX_MARKS[c.component_name] || c.max_marks} Marks</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
