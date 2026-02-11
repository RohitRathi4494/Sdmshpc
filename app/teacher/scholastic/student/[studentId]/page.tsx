'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

// Types matching backend
interface StudentReport {
    scholastic: any[];
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
    grade: string;
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

export default function ScholasticEntryPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const router = useRouter();

    const [reportData, setReportData] = useState<StudentReport | null>(null);
    const [scores, setScores] = useState<Record<string, ScholasticScore>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [components, setComponents] = useState<AssessmentComponent[]>([]);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('hpc_token') || undefined;

                const [report, componentsData] = await Promise.all([
                    ApiClient.get<StudentReport>(`/reports/student/${studentId}?academic_year_id=1`, token),
                    ApiClient.get<AssessmentComponent[]>('/teacher/assessment-components', token)
                ]);

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

                // Mock Subjects based on schema
                const subjectList = SUBJECTS_ORDER.map((name, idx) => ({ id: idx + 1, name }));
                setSubjects(subjectList);

            } catch (error) {
                console.error('Failed to load data', error);
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
        // Validation for marks
        if (field === 'marks') {
            const component = components.find(c => c.id === componentId);
            if (component && typeof value === 'number') {
                if (value < 0 || value > component.max_marks) {
                    alert(`Marks for ${component.component_name} must be between 0 and ${component.max_marks}`);
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
            grade: '',
            marks: null,
            academic_year_id: 1 // Default
        };

        // Optimistic Update
        const updated = { ...current, [field]: value };
        setScores(prev => ({ ...prev, [key]: updated }));
        setSaving(true);

        try {
            const token = localStorage.getItem('hpc_token') || undefined;
            await ApiClient.post('/teacher/scholastic-scores', updated, token);
            setSaving(false);
        } catch (error) {
            console.error('Save failed', error);
            setSaving(false);
        }
    }, [scores, studentId, components]);

    if (loading || !reportData) return <div className="p-8 text-center">Loading assessment data...</div>;

    return (
        <div className="max-w-full mx-auto">
            <button
                onClick={() => router.back()}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{reportData.student.student_name}</h2>
                    <p className="text-gray-500">Class: {reportData.student.class_name} - {reportData.student.section_name} | Adm: {reportData.student.admission_no}</p>
                </div>
                <div className={`px-4 py-2 rounded text-sm font-bold ${saving ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {saving ? 'Saving...' : 'All Changes Saved'}
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
                                    <span className="text-gray-400 font-normal">({comp.max_marks} Marks)</span>
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
                                    {subject.name}
                                </td>
                                {components.map(comp => (
                                    <React.Fragment key={comp.id}>
                                        {TERMS.map(term => {
                                            const key = `${subject.id}-${comp.id}-${term.id}`;
                                            const score = scores[key] || {};
                                            return (
                                                <td key={term.id} className="px-2 py-2 border-r min-w-[140px]">
                                                    <div className="flex space-x-1">
                                                        <select
                                                            className="block w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1"
                                                            value={score.grade || ''}
                                                            onChange={(e) => handleScoreChange(subject.id, comp.id, term.id, 'grade', e.target.value)}
                                                        >
                                                            <option value="">-</option>
                                                            <option value="A1">A1</option>
                                                            <option value="A2">A2</option>
                                                            <option value="B1">B1</option>
                                                            <option value="B2">B2</option>
                                                            <option value="C1">C1</option>
                                                            <option value="C2">C2</option>
                                                            <option value="D">D</option>
                                                            <option value="E">E</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            placeholder={`/${comp.max_marks}`}
                                                            className="block w-16 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1"
                                                            value={score.marks !== undefined && score.marks !== null ? score.marks : ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                handleScoreChange(subject.id, comp.id, term.id, 'marks', val === '' ? '' : parseFloat(val));
                                                            }}
                                                            max={comp.max_marks}
                                                            min={0}
                                                        />
                                                    </div>
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
                        <li key={c.id}>{c.component_name}: Max {c.max_marks} Marks</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
