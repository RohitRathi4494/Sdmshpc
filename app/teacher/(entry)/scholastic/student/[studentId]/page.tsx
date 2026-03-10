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
    grade?: string | null;
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
    const [lockedByTerm, setLockedByTerm] = useState<Record<number, number[]>>({}); // term_id -> locked component_ids

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

                // Fetch locks for both terms
                try {
                    const [locksT1, locksT2] = await Promise.all([
                        ApiClient.get<number[]>(`/teacher/assessment-locks?academic_year_id=1&student_id=${studentId}&term_id=1`, token),
                        ApiClient.get<number[]>(`/teacher/assessment-locks?academic_year_id=1&student_id=${studentId}&term_id=2`, token)
                    ]);
                    setLockedByTerm({
                        1: locksT1 || [],
                        2: locksT2 || []
                    });
                } catch (lockError) {
                    console.error('Failed to fetch locks:', lockError);
                }

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

        const isLocked = lockedByTerm[termId]?.includes(componentId);
        if (isLocked) {
            setSaveError("This assessment is locked by the administrator.");
            return;
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

    // Determine class-specific visibility
    const className = reportData.student?.class_name?.toUpperCase().trim() || '';
    const isXiOrXii = ['XI', '11', 'XII', '12'].includes(className);
    const isClassX = ['X', '10'].includes(className);
    const SEA_ID = 2;          // Subject Enrichment Activities
    const IA_ID = 3;           // Internal Assessment
    const LAB_ID = 5;          // Lab Assessment

    const visibleComponents = components.filter(c => {
        if (isXiOrXii) {
            // For XI/XII: hide IA only; SEA stays (rendered as grade), Lab Assessment stays
            return c.id !== IA_ID;
        } else if (isClassX) {
            // For X: hide IA only; SEA stays (rendered as grade)
            return c.id !== IA_ID && c.id !== LAB_ID;
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
                const seaComp = components.find(c => c.component_name === 'Subject Enrichment Activities');

                const mkInput = (subjectId: number, comp: AssessmentComponent, termId: number, maxMarks: number, isNA = false) => {
                    if (isNA) return (
                        <td className="px-2 py-2 border-r min-w-[100px] text-center bg-gray-100 text-gray-400 text-sm">N/A</td>
                    );
                    const key = `${subjectId}-${comp.id}-${termId}`;
                    const score = scores[key] || {};
                    const isLocked = lockedByTerm[termId]?.includes(comp.id);
                    return (
                        <td key={key} className="px-2 py-2 border-r min-w-[100px] text-center">
                            <input
                                type="number"
                                className={`block w-20 text-sm border-gray-300 rounded-md p-1 mx-auto text-center ${isLocked ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                                value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                max={maxMarks} min={0}
                                disabled={isLocked}
                                title={isLocked ? "Locked by Administrator" : ""}
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
                                    <th rowSpan={3} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r sticky left-0 bg-gray-50 z-10 w-48">
                                        Subjects
                                    </th>
                                    <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        Periodic Assessment<br />
                                        <span className="text-gray-400 font-normal">(20 Marks)</span>
                                    </th>
                                    <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        Subject Enrichment<br />
                                        <span className="text-gray-400 font-normal">(Grade)</span>
                                    </th>
                                    <th colSpan={4} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                        Terminal Assessment<br />
                                        <span className="text-gray-400 font-normal">(80 Marks)</span>
                                    </th>
                                </tr>
                                <tr>
                                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term I</th>
                                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term II</th>
                                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term I</th>
                                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term II</th>
                                    <th colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50 border-b">Theory</th>
                                    <th colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50 border-b">Practical</th>
                                </tr>
                                <tr>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term II</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term I</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r bg-gray-50">Term II</th>
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
                                            {/* SEA — Term I & II (grade select) */}
                                            {seaComp ? TERMS.map(t => {
                                                const key = `${subject.id}-${seaComp.id}-${t.id}`;
                                                const score = scores[key] || {};
                                                const isLocked = lockedByTerm[t.id]?.includes(seaComp.id);
                                                return (
                                                    <td key={key} className="px-2 py-2 border-r min-w-[110px] text-center">
                                                        <select
                                                            value={score.grade || ''}
                                                            onChange={e => handleScoreChange(subject.id, seaComp.id, t.id, 'grade', e.target.value)}
                                                            disabled={isLocked}
                                                            title={isLocked ? "Locked by Administrator" : ""}
                                                            className={`block w-[90px] text-sm border border-gray-300 rounded-md p-1 mx-auto text-center ${isLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:ring-blue-500 focus:border-blue-500'}`}
                                                        >
                                                            <option value="">—</option>
                                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'].map(g => <option key={g} value={g}>{g}</option>)}
                                                        </select>
                                                    </td>
                                                );
                                            }) : <><td className="px-2 py-2 border-r text-center bg-gray-100 text-gray-400 text-sm">N/A</td><td className="px-2 py-2 border-r text-center bg-gray-100 text-gray-400 text-sm">N/A</td></>}
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
                                {visibleComponents.map(comp => {
                                    const headerMax = subjects.length > 0 ? getDynamicMaxMarks(subjects[0].id, comp.id) : 0;
                                    // For Class X, SEA is graded not marked
                                    const headerLabel = (isClassX && comp.id === SEA_ID)
                                        ? 'Grade'
                                        : (headerMax > 0 ? `${headerMax} Marks` : 'Varies Marks');
                                    return (
                                        <th key={comp.id} colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-b">
                                            {comp.component_name} <br />
                                            <span className="text-gray-400 font-normal">({headerLabel})</span>
                                        </th>
                                    );
                                })}
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
                                                const isLocked = lockedByTerm[term.id]?.includes(comp.id);

                                                // Class X SEA → grade select
                                                if (isClassX && comp.id === SEA_ID) {
                                                    return (
                                                        <td key={term.id} className="px-2 py-2 border-r min-w-[100px] text-center">
                                                            <select
                                                                className={`block w-20 text-sm border border-gray-300 rounded-md p-1 mx-auto text-center ${isLocked ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                                                                value={score.grade !== undefined && score.grade !== null ? score.grade : ''}
                                                                disabled={isLocked}
                                                                title={isLocked ? "Locked by Administrator" : ""}
                                                                onChange={(e) => {
                                                                    handleScoreChange(subject.id, comp.id, term.id, 'grade', e.target.value);
                                                                }}
                                                            >
                                                                <option value="">—</option>
                                                                <option value="A1">A1</option>
                                                                <option value="A2">A2</option>
                                                                <option value="B1">B1</option>
                                                                <option value="B2">B2</option>
                                                                <option value="C1">C1</option>
                                                                <option value="C2">C2</option>
                                                                <option value="D">D</option>
                                                                <option value="E">E</option>
                                                            </select>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={term.id} className="px-2 py-2 border-r min-w-[100px] text-center">
                                                        <input
                                                            type="number"
                                                            placeholder={maxMarks === 0 ? 'N/A' : ''}
                                                            className={`block w-20 text-sm border-gray-300 rounded-md p-1 mx-auto text-center ${(maxMarks === 0 || isLocked) ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                                                            value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                                            disabled={maxMarks === 0 || isLocked}
                                                            title={isLocked ? "Locked by Administrator" : ""}
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
