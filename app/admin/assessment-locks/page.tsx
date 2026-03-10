'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

interface AcademicYear {
    id: number;
    year_name: string;
    is_active: boolean;
}

interface ClassData {
    id: number;
    class_name: string;
}

interface Term {
    id: number;
    term_name: string;
}

interface AssessmentComponent {
    id: number;
    name: string;
    display_name?: string;
    type?: string;
}

interface AssessmentLock {
    id?: number;
    academic_year_id: number;
    class_id: number;
    term_id: number;
    component_id: number;
    is_locked: boolean;
    locked_by_name?: string;
    locked_at?: string;
}

export default function AssessmentLocksPage() {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [components, setComponents] = useState<{ scholastic: AssessmentComponent[], co_scholastic: AssessmentComponent[] }>({ scholastic: [], co_scholastic: [] });
    const [locks, setLocks] = useState<AssessmentLock[]>([]);

    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
    const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchMasters();
    }, []);

    useEffect(() => {
        if (selectedYearId) {
            fetchLocks();
        }
    }, [selectedYearId]);

    const fetchMasters = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            const [yearsData, classesData, compsData] = await Promise.all([
                ApiClient.get<AcademicYear[]>('/admin/academic-years', token),
                ApiClient.get<ClassData[]>('/admin/classes', token),
                ApiClient.get<{ scholastic: AssessmentComponent[], co_scholastic: AssessmentComponent[] }>('/admin/assessment-components', token),
            ]);

            const termsData: Term[] = [
                { id: 1, term_name: 'Term I' },
                { id: 2, term_name: 'Term II' }
            ];

            setYears(yearsData);
            setClasses(classesData);
            setTerms(termsData);
            setComponents(compsData);

            const activeYear = yearsData.find(y => y.is_active);
            if (activeYear) {
                setSelectedYearId(activeYear.id);
            } else if (yearsData.length > 0) {
                setSelectedYearId(yearsData[0].id);
            }

        } catch (error) {
            console.error(error);
            alert('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchLocks = async () => {
        if (!selectedYearId) return;
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            const data = await ApiClient.get<AssessmentLock[]>(`/admin/assessment-locks?academic_year_id=${selectedYearId}`, token);
            setLocks(data || []);
        } catch (error: any) {
            console.error(error);
            setLocks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLock = async (classId: number, termId: number, componentId: number, currentStatus: boolean, skipRefetch = false) => {
        if (!selectedYearId) return;

        const actionText = currentStatus ? "UNLOCK" : "LOCK";
        const msg = skipRefetch
            ? `Are you sure you want to ${actionText} this specific assessment?`
            : `Are you sure you want to ${actionText} data entry for this Assessment?`;

        if (!confirm(msg)) return;

        setProcessing(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            await ApiClient.post('/admin/assessment-locks', {
                academic_year_id: selectedYearId,
                class_id: classId,
                term_id: termId,
                component_id: componentId,
                is_locked: !currentStatus
            }, token);

            if (!skipRefetch) {
                await fetchLocks();
            }
        } catch (error: any) {
            console.error(error);
            alert(`Failed to ${actionText} assessment: ` + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyLockSelection = async () => {
        if (!selectedYearId || !selectedClassId || !selectedTermId || !selectedComponentId) {
            alert("Please select Academic Year, Class, Term and Assessment Component first");
            return;
        }

        // Find current status
        const lockRecord = locks.find(l =>
            l.class_id === selectedClassId &&
            l.term_id === selectedTermId &&
            l.component_id === selectedComponentId
        );
        const currentStatus = lockRecord ? lockRecord.is_locked : false;

        await handleToggleLock(selectedClassId, selectedTermId, selectedComponentId, currentStatus);
    };

    const getLockStatus = (classId: number, termId: number, componentId: number) => {
        return locks.find(l => l.class_id === classId && l.term_id === termId && l.component_id === componentId);
    };

    if (loading && years.length === 0) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    const allComponents = [...components.scholastic, ...components.co_scholastic];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-800 flex-1">Assessment Data Locking</h1>
            </div>

            <div className="bg-white border text-sm text-gray-600 rounded shadow-sm p-4 mb-8">
                <p>Assessment locking prevents teachers from modifying <strong>Marks and Grades</strong> for specific Scholastic/Co-scholastic components (e.g., PA1, Term Assessment) in a given Term.
                    Attendance and Remarks remain editable.
                    Teachers will still be able to view their data.</p>
            </div>

            {/* Quick Lock Controls */}
            <div className="bg-white border rounded shadow p-6 mb-8 flex flex-wrap gap-6 items-end">
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <select
                        value={selectedYearId || ''}
                        onChange={e => setSelectedYearId(Number(e.target.value))}
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md"
                    >
                        {years.map(y => (
                            <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Active)' : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="w-full md:w-auto border-l pl-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            value={selectedClassId || ''}
                            onChange={e => setSelectedClassId(Number(e.target.value))}
                            className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.class_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                        <select
                            value={selectedTermId || ''}
                            onChange={e => setSelectedTermId(Number(e.target.value))}
                            className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select --</option>
                            {terms.map(t => (
                                <option key={t.id} value={t.id}>{t.term_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assessment / Component</label>
                        <select
                            value={selectedComponentId || ''}
                            onChange={e => setSelectedComponentId(Number(e.target.value))}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md max-w-xs"
                        >
                            <option value="">-- Select --</option>
                            <optgroup label="Scholastic">
                                {components.scholastic.map(c => (
                                    <option key={`s-${c.id}`} value={c.id}>{c.display_name || c.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Co-Scholastic">
                                {components.co_scholastic.map(c => (
                                    <option key={`c-${c.id}`} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <button
                        onClick={handleApplyLockSelection}
                        disabled={processing || !selectedClassId || !selectedTermId || !selectedComponentId}
                        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {processing ? 'Processing...' : 'Toggle Status'}
                    </button>
                </div>
            </div>

            {/* Matrix View */}
            <div className="bg-white border rounded shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Detailed Lock Status Overview</h3>
                    <button onClick={fetchLocks} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-800">
                        {loading ? 'Refreshing...' : '↻ Refresh Status'}
                    </button>
                </div>

                <div className="p-4 overflow-x-auto text-sm">
                    {terms.map(term => (
                        <div key={term.id} className="mb-8 border rounded overflow-hidden">
                            <div className="bg-gray-100 font-bold p-3 border-b">{term.term_name}</div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="px-4 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">Class</th>
                                            {allComponents.map(comp => (
                                                <th key={comp.id} className="px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap min-w-[140px]">
                                                    {comp.display_name || comp.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {classes.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white z-10 border-r">{c.class_name}</td>
                                                {allComponents.map(comp => {
                                                    const lockRecord = getLockStatus(c.id, term.id, comp.id);
                                                    const isLocked = lockRecord ? lockRecord.is_locked : false;

                                                    return (
                                                        <td key={comp.id} className="px-4 py-2 border-r min-w-[140px]">
                                                            <button
                                                                onClick={() => handleToggleLock(c.id, term.id, comp.id, isLocked, true)}
                                                                disabled={processing}
                                                                className={`flex items-center justify-center gap-1.5 w-full py-1.5 rounded border transition-all ${isLocked
                                                                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                                    } disabled:opacity-50`}
                                                                title={lockRecord?.locked_at ? `Locked by ${lockRecord.locked_by_name || 'Admin'} at ${new Date(lockRecord.locked_at).toLocaleString()}` : ''}
                                                            >
                                                                {isLocked ? (
                                                                    <><Lock className="w-3 h-3" /> Locked</>
                                                                ) : (
                                                                    <><Unlock className="w-3 h-3" /> Open</>
                                                                )}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
