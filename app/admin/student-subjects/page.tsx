'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

type SubjectType = 'mandatory' | 'optional_5th' | 'additional_6th' | null;

// assignment[studentId][subjectId] = SubjectType
type AssignmentMap = Record<number, Record<number, SubjectType>>;

const LABEL: Record<string, string> = {
    mandatory: '✓',
    optional_5th: '5',
    additional_6th: '6',
};

const CYCLE: SubjectType[] = [null, 'mandatory', 'optional_5th', 'additional_6th'];

export default function BulkSubjectAssignmentPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [academicYear, setAcademicYear] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<AssignmentMap>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load masters on mount
    useEffect(() => {
        const init = async () => {
            const token = sessionStorage.getItem('hpc_token') || '';
            const [cls, yrs] = await Promise.all([
                ApiClient.get<any[]>('/admin/classes', token),
                ApiClient.get<any[]>('/admin/academic-years', token),
            ]);
            // Only XI / XII classes
            const highClasses = cls.filter(c => {
                const n = c.class_name.toUpperCase();
                return n.includes('XI') || n.includes('XII') || n === '11' || n === '12';
            });
            setClasses(highClasses);
            const active = yrs.find(y => y.is_active);
            if (active) setAcademicYear(active);
        };
        init();
    }, []);

    // Load students + subjects + existing assignments when class changes
    useEffect(() => {
        if (!selectedClassId || !academicYear) return;
        const load = async () => {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                const [studs, classSubs, existingRaw] = await Promise.all([
                    ApiClient.get<any[]>(`/admin/students?class_id=${selectedClassId}&academic_year_id=${academicYear.id}`, token),
                    ApiClient.get<any[]>(`/admin/class-subjects?class_id=${selectedClassId}&academic_year_id=${academicYear.id}`, token),
                    fetch(`/api/admin/student-subjects?class_id=${selectedClassId}&academic_year_id=${academicYear.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                ]);

                // Enrich subject names
                const allSubjects = await ApiClient.get<any[]>('/admin/subjects', token);
                const subMap = new Map(allSubjects.map(s => [s.id, s.subject_name]));
                const enriched = classSubs.map(cs => ({
                    subject_id: cs.subject_id,
                    subject_name: subMap.get(cs.subject_id) || `Subject ${cs.subject_id}`,
                    display_order: cs.display_order,
                })).sort((a, b) => a.display_order - b.display_order);

                setStudents(studs);
                setSubjects(enriched);

                // Build assignment map from existing data
                const map: AssignmentMap = {};
                studs.forEach(s => { map[s.id] = {}; });
                if (existingRaw.success && existingRaw.data) {
                    existingRaw.data.forEach((row: any) => {
                        if (!map[row.student_id]) map[row.student_id] = {};
                        map[row.student_id][row.subject_id] = row.subject_type as SubjectType;
                    });
                }
                setAssignments(map);
            } catch (e: any) {
                alert('Failed to load: ' + e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [selectedClassId, academicYear]);

    // Cycle through: null → mandatory → optional_5th → additional_6th → null
    const cycleCell = useCallback((studentId: number, subjectId: number) => {
        setAssignments(prev => {
            const current = prev[studentId]?.[subjectId] ?? null;
            const idx = CYCLE.indexOf(current);
            const next = CYCLE[(idx + 1) % CYCLE.length];
            return {
                ...prev,
                [studentId]: { ...(prev[studentId] || {}), [subjectId]: next }
            };
        });
    }, []);

    const handleSaveAll = async () => {
        if (!academicYear || !selectedClassId) return;
        setSaving(true);
        const token = sessionStorage.getItem('hpc_token') || '';
        let errorCount = 0;

        try {
            const promises = students.map(async student => {
                const studentAssign = assignments[student.id] || {};
                const subjects_payload = Object.entries(studentAssign)
                    .filter(([, type]) => type !== null)
                    .map(([subjectId, type]) => ({
                        subject_id: Number(subjectId),
                        subject_type: type as string
                    }));

                try {
                    await ApiClient.post('/admin/student-subjects', {
                        student_id: student.id,
                        class_id: selectedClassId,
                        academic_year_id: academicYear.id,
                        subjects: subjects_payload,
                    }, token);
                } catch {
                    errorCount++;
                }
            });
            await Promise.all(promises);
            if (errorCount > 0) {
                alert(`Saved with ${errorCount} errors. Please try again.`);
            } else {
                alert('All subject assignments saved successfully!');
            }
        } finally {
            setSaving(false);
        }
    };

    const getCell = (studentId: number, subjectId: number): SubjectType =>
        assignments[studentId]?.[subjectId] ?? null;

    const cellStyle = (type: SubjectType) => {
        if (type === 'mandatory') return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        if (type === 'optional_5th') return 'bg-green-100 text-green-800 border-green-300';
        if (type === 'additional_6th') return 'bg-amber-100 text-amber-800 border-amber-300';
        return 'bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100';
    };

    return (
        <div className="p-4 md:p-8 max-w-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-sm">← Back</button>
                <h1 className="text-2xl font-bold text-gray-800 flex-1">Subject Assignment — Class XI / XII</h1>
                {selectedClassId && (
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded shadow font-medium text-sm"
                    >
                        {saving ? 'Saving...' : '💾 Save All Assignments'}
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5 text-xs font-medium">
                <span className="px-3 py-1 rounded border bg-gray-50 text-gray-400 border-gray-200">— Empty (not assigned)</span>
                <span className="px-3 py-1 rounded border bg-indigo-100 text-indigo-800 border-indigo-300">✓ Mandatory</span>
                <span className="px-3 py-1 rounded border bg-green-100 text-green-800 border-green-300">5 Optional 5th (counts in total)</span>
                <span className="px-3 py-1 rounded border bg-amber-100 text-amber-800 border-amber-300">6 Additional 6th (excluded from total)</span>
                <span className="text-gray-500 italic">← Click any cell to cycle through assignments</span>
            </div>

            {/* Class Selector */}
            <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-gray-700">Select Class:</label>
                <select
                    value={selectedClassId || ''}
                    onChange={e => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                >
                    <option value="">-- Select Class --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading students and subjects...</div>
            ) : selectedClassId && students.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No students enrolled in this class.</div>
            ) : selectedClassId && subjects.length === 0 ? (
                <div className="p-12 text-center text-gray-400">No subjects mapped for this class. Please go to Subject Mapping first.</div>
            ) : selectedClassId ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gray-800 z-10 min-w-[200px]">Student</th>
                                {subjects.map(sub => (
                                    <th key={sub.subject_id} className="px-3 py-3 text-center font-semibold min-w-[100px] whitespace-normal leading-tight">
                                        {sub.subject_name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map((student, idx) => (
                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-4 py-2 sticky left-0 bg-inherit z-10 border-r border-gray-200">
                                        <div className="font-medium text-gray-900 text-xs">{student.student_name}</div>
                                        <div className="text-gray-400 text-xs">{student.admission_no}</div>
                                    </td>
                                    {subjects.map(sub => {
                                        const type = getCell(student.id, sub.subject_id);
                                        return (
                                            <td key={sub.subject_id} className="px-2 py-2 text-center">
                                                <button
                                                    onClick={() => cycleCell(student.id, sub.subject_id)}
                                                    className={`w-10 h-8 rounded border text-xs font-bold transition-all cursor-pointer select-none ${cellStyle(type)}`}
                                                    title={type ? `${type} — click to change` : 'Click to assign'}
                                                >
                                                    {type ? LABEL[type] : '—'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    Select a class above to start assigning subjects to students.
                </div>
            )}
        </div>
    );
}
