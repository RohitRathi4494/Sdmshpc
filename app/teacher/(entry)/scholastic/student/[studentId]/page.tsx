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

    // Helper to get dynamic max marks
    const getDynamicMaxMarks = useCallback((subjectId: number, componentId: number) => {
        const subject = subjects.find(s => s.id === subjectId || s.subject_id === subjectId);
        const comp = components.find(c => c.id === componentId);
        if (!comp) return 0;

        if (subject && subject.assessment_max_marks && subject.assessment_max_marks[componentId] !== undefined) {
            return Number(subject.assessment_max_marks[componentId]);
        }
        return COMPONENT_MAX_MARKS[comp.component_name] || comp.max_marks;
    }, [subjects, components]);

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
        if (field === 'marks' && typeof value === 'number') {
            const maxMarks = getDynamicMaxMarks(subjectId, componentId);
            const comp = components.find(c => c.id === componentId);
            const compName = comp ? comp.component_name : 'Assessment';

            if (maxMarks === 0) {
                alert(`${compName} is disabled for this subject (Max Marks: 0).`);
                return;
            }
            if (value < 0 || value > maxMarks) {
                alert(`Marks for ${compName} in this subject must be between 0 and ${maxMarks}`);
                return;
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
    }, [scores, studentId, components, getDynamicMaxMarks]);

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

    // Determine if XI/XII to filter components
    const className = reportData.student?.class_name?.toUpperCase().trim() || '';
    const isXiOrXii = ['XI', '11', 'XII', '12'].includes(className);
    const SEA_ID = 2;          // Subject Enrichment Activities
    const IA_ID = 3;           // Internal Assessment
    const LAB_ID = 5;          // Lab Assessment

    const visibleComponents = components.filter(c => {
        if (isXiOrXii) {
            // For XI/XII: hide SEA and IA; show Lab Assessment
            return c.id !== SEA_ID && c.id !== IA_ID;
        } else {
            // For other classes: hide Lab Assessment
            return c.id !== LAB_ID;
        }
    });

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
            {isXiOrXii ? (() => {
                // XI/XII custom layout: PA (20) | Theory + Lab (80 merged)
                const paComp = components.find(c => c.component_name === 'Periodic Assessment');
                const taComp = components.find(c => c.component_name === 'Terminal Assessment');
                const labComp = components.find(c => c.component_name === 'Lab Assessment');

                const mkInput = (subjectId: number, comp: AssessmentComponent, termId: number, maxMarks: number, isNA = false) => {
                    if (isNA) return (
                        <td className="px-2 py-2 border-r min-w-[100px] text-center bg-gray-100 text-gray-400 text-sm">N/A</td>
                    );
                    const key = `${subjectId}-${comp.id}-${termId}`;
                    const score = scores[key] || {};
                    return (
                        <td key={key} className="px-2 py-2 border-r min-w-[100px] text-center">
                            <input
                                type="number"
                                className="block w-20 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 mx-auto text-center"
                                value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                max={maxMarks} min={0}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleScoreChange(subjectId, comp.id, termId, 'marks', val !== '' ? parseFloat(val) : '');
                                }}
                            />
                        </td>
                    );
                };

                return (
                    <div className="overflow-x-auto shadow rounded-lg border bg-white mb-10">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 w-48">
                                        Subjects
                                    </th>
                                    <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        Periodic Assessment<br />
                                        <span className="text-gray-400 font-normal">(20 Marks)</span>
                                    </th>
                                    <th colSpan={4} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        Theory + Practical Assessment<br />
                                        <span className="text-gray-400 font-normal">(80 Marks)</span>
                                    </th>
                                </tr>
                                <tr>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term II</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Theory T-I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Theory T-II</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Practical T-I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Practical T-II</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subjects.map(subject => {
                                    const labMax = labComp ? getDynamicMaxMarks(subject.id, labComp.id) : 0;
                                    const taMax = taComp ? getDynamicMaxMarks(subject.id, taComp.id) : 60;
                                    const hasLab = labMax > 0;
                                    return (
                                        <tr key={subject.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r sticky left-0 bg-white z-10">
                                                {subject.subject_name || subject.name}
                                            </td>
                                            {/* PA — Term I & II (max 20) */}
                                            {paComp ? TERMS.map(t => mkInput(subject.id, paComp, t.id, 20)) : <><td /><td /></>}
                                            {/* TA — Term I & II */}
                                            {taComp ? TERMS.map(t => mkInput(subject.id, taComp, t.id, taMax)) : <><td /><td /></>}
                                            {/* Lab — Term I & II (NA if no lab) */}
                                            {labComp
                                                ? TERMS.map(t => mkInput(subject.id, labComp, t.id, labMax, !hasLab))
                                                : <><td className="px-2 py-2 border-r text-center bg-gray-100 text-gray-400 text-sm">N/A</td><td className="px-2 py-2 border-r text-center bg-gray-100 text-gray-400 text-sm">N/A</td></>
                                            }
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })() : (
                // Generic table for other classes
                <div className="overflow-x-auto shadow rounded-lg border bg-white mb-10">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 w-48">
                                    Subjects
                                </th>
                                {visibleComponents.map(comp => (
                                    <th key={comp.id} colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        {comp.component_name} <br />
                                        <span className="text-gray-400 font-normal">({comp.max_marks > 0 ? comp.max_marks : 'varies'} Marks)</span>
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {visibleComponents.map(comp => (
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
                                    {visibleComponents.map(comp => (
                                        <React.Fragment key={comp.id}>
                                            {TERMS.map(term => {
                                                const key = `${subject.id}-${comp.id}-${term.id}`;
                                                const score = scores[key] || {};
                                                const maxMarks = getDynamicMaxMarks(subject.id, comp.id);
                                                return (
                                                    <td key={term.id} className="px-2 py-2 border-r min-w-[100px] text-center">
                                                        <input
                                                            type="number"
                                                            placeholder={maxMarks === 0 ? 'N/A' : ''}
                                                            className={`block w-20 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 mx-auto text-center ${maxMarks === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                            value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                                            disabled={maxMarks === 0}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                let numVal: number | string = '';
                                                                if (val !== '') numVal = parseFloat(val);
                                                                handleScoreChange(subject.id, comp.id, term.id, 'marks', numVal);
                                                            }}
                                                            max={maxMarks} min={0}
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
            )}

            <div className="p-4 bg-blue-50 text-blue-800 rounded mb-8 text-sm">
                <p className="font-bold">Assessment Structure:</p>
                <ul className="list-disc ml-5 mt-1">
                    {isXiOrXii ? (
                        <>
                            <li>Periodic Assessment: Max 20 Marks (per term)</li>
                            <li>Theory Assessment: Max varies per subject (per term)</li>
                            <li>Practical Assessment: Max varies per subject / N/A if no practical assigned (per term)</li>
                            <li>Theory + Practical combined = 80 Marks per term</li>
                        </>
                    ) : (
                        visibleComponents.map(c => (
                            <li key={c.id}>{c.component_name}: Max {c.max_marks > 0 ? c.max_marks : 'varies'} Marks</li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
