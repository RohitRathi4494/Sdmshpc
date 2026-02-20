'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import SubjectMaster from './SubjectMaster';

interface Subject {
    id: number;
    subject_name: string;
}

interface ClassData {
    id: number;
    class_name: string;
}

interface AcademicYear {
    id: number;
    year_name: string;
    is_active: boolean;
}

interface Assignment {
    subject_id: number;
    max_marks: number;
}

export default function SubjectMappingPage() {
    const [activeTab, setActiveTab] = useState<'mapping' | 'master'>('mapping');
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

    // Map of subjectId -> max_marks. If present in map, it's assigned.
    const [assignments, setAssignments] = useState<Map<number, number>>(new Map());

    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMapping, setLoadingMapping] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchMasters = async () => {
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            const [classesData, yearsData, subjectsData] = await Promise.all([
                ApiClient.get<ClassData[]>('/admin/classes', token),
                ApiClient.get<AcademicYear[]>('/admin/academic-years', token),
                ApiClient.get<Subject[]>('/admin/subjects', token),
            ]);

            setClasses(classesData);
            setYears(yearsData);
            setAllSubjects(subjectsData);

            // Auto-select active year
            if (!selectedYearId) {
                const activeYear = yearsData.find(y => y.is_active);
                if (activeYear) setSelectedYearId(activeYear.id);
            }

        } catch (error) {
            alert('Failed to load master data');
        } finally {
            setLoadingInitial(false);
        }
    };

    useEffect(() => {
        fetchMasters();
    }, []);

    // Fetch mapping when selection changes
    useEffect(() => {
        if (!selectedClassId || !selectedYearId) {
            setAssignments(new Map());
            return;
        }

        const fetchMapping = async () => {
            setLoadingMapping(true);
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                // API now returns { subject_id, max_marks }[]
                const data = await ApiClient.get<Assignment[]>(`/admin/class-subjects?class_id=${selectedClassId}&academic_year_id=${selectedYearId}`, token);

                const newMap = new Map<number, number>();
                data.forEach(item => newMap.set(item.subject_id, item.max_marks || 100));
                setAssignments(newMap);

            } catch (error) {
                console.error(error);
                setAssignments(new Map());
            } finally {
                setLoadingMapping(false);
            }
        };
        fetchMapping();

    }, [selectedClassId, selectedYearId]);


    const handleToggleSubject = (subjectId: number) => {
        setAssignments(prev => {
            const newMap = new Map(prev);
            if (newMap.has(subjectId)) {
                newMap.delete(subjectId);
            } else {
                newMap.set(subjectId, 100); // Default max marks
            }
            return newMap;
        });
    };

    const handleMaxMarksChange = (subjectId: number, marks: number) => {
        setAssignments(prev => {
            const newMap = new Map(prev);
            if (newMap.has(subjectId)) {
                newMap.set(subjectId, marks);
            }
            return newMap;
        });
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedYearId) return;

        setSaving(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            // Convert map to array of objects
            const subjectsPayload = Array.from(assignments.entries()).map(([subject_id, max_marks]) => ({
                subject_id,
                max_marks
            }));

            await ApiClient.post('/admin/class-subjects', {
                class_id: selectedClassId,
                academic_year_id: selectedYearId,
                subjects: subjectsPayload
            }, token);
            alert('Subjects assigned successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to save assignments');
        } finally {
            setSaving(false);
        }
    };

    const router = useRouter();

    if (loadingInitial) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div>
            <div className="flex items-center mb-6">
                <button
                    onClick={() => router.back()}
                    className="mr-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Subject Management</h1>
            </div>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('mapping')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'mapping' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Class & Subject Mapping
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'master' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Manage Subjects (Master)
                </button>
            </div>

            {activeTab === 'master' ? (
                <SubjectMaster onUpdate={fetchMasters} />
            ) : (
                <>
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 mb-6 flex gap-6">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <select
                                value={selectedYearId || ''}
                                onChange={e => setSelectedYearId(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select Year</option>
                                {years.map(y => (
                                    <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Active)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select
                                value={selectedClassId || ''}
                                onChange={e => setSelectedClassId(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedClassId && selectedYearId && (
                        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700">Assign Subjects & Weightage</h3>
                                <div className="flex-1"></div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>

                            <div className="p-6">
                                {loadingMapping ? (
                                    <div className="text-center py-4 text-gray-500">Loading assignments...</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-12 gap-4 font-semibold text-gray-500 border-b pb-2 mb-2">
                                            <div className="col-span-1 text-center">Select</div>
                                            <div className="col-span-7">Subject Name</div>
                                            <div className="col-span-4">Max Marks (Weightage)</div>
                                        </div>
                                        {allSubjects.map(subject => {
                                            const isSelected = assignments.has(subject.id);
                                            const marks = assignments.get(subject.id) || 100;

                                            return (
                                                <div key={subject.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded border transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                    <div className="col-span-1 flex justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSubject(subject.id)}
                                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                        />
                                                    </div>
                                                    <div className="col-span-7 font-medium text-gray-800">
                                                        {subject.subject_name}
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input
                                                            type="number"
                                                            value={marks}
                                                            onChange={e => handleMaxMarksChange(subject.id, parseInt(e.target.value) || 0)}
                                                            disabled={!isSelected}
                                                            className="w-full px-3 py-1 border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                                                            min="1"
                                                            max="1000"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
