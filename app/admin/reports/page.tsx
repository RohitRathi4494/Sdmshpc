'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/app/lib/api-client';

interface Student {
    id: number;
    admission_no: string;
    student_name: string;
    roll_no: number;
    father_name: string;
    class_id: number;
    section_id: number;
}

interface ClassData {
    id: number;
    class_name: string;
}

interface SectionData {
    id: number;
    section_name: string;
    class_id: number;
}

interface AcademicYear {
    id: number;
    year_name: string;
    is_active: boolean;
}

export default function ReportsPage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
    const [students, setStudents] = useState<Student[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const fetchMasters = async () => {
            const token = sessionStorage.getItem('hpc_token') || '';
            const [cls, sec, yrs] = await Promise.all([
                ApiClient.get<ClassData[]>('/admin/classes', token),
                ApiClient.get<SectionData[]>('/admin/sections', token),
                ApiClient.get<AcademicYear[]>('/admin/academic-years', token)
            ]);
            setClasses(cls);
            setSections(sec);
            const active = yrs.find(y => y.is_active);
            if (active) setAcademicYear(active);
        };
        fetchMasters();
    }, []);

    // Fetch Students
    useEffect(() => {
        const fetchStudents = async () => {
            if (!academicYear || !selectedClassId) {
                setStudents([]);
                return;
            }

            setLoading(true);
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                let url = `/admin/students?class_id=${selectedClassId}&academic_year_id=${academicYear.id}`;
                if (selectedSectionId) url += `&section_id=${selectedSectionId}`;

                const data = await ApiClient.get<Student[]>(url, token);
                setStudents(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedClassId, selectedSectionId, academicYear]);

    const filteredSections = sections.filter(s => s.class_id === selectedClassId);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Student Report Cards</h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded shadow border border-gray-100 flex gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class</label>
                    <select
                        value={selectedClassId || ''}
                        onChange={e => { setSelectedClassId(Number(e.target.value)); setSelectedSectionId(null); }}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Section</label>
                    <select
                        value={selectedSectionId || ''}
                        onChange={e => setSelectedSectionId(Number(e.target.value))}
                        disabled={!selectedClassId}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-40 disabled:bg-gray-100"
                    >
                        <option value="">Select Section</option>
                        {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
                {!selectedClassId ? (
                    <div className="p-8 text-center text-gray-500">Please select a class to view report cards.</div>
                ) : loading ? (
                    <div className="p-8 text-center text-gray-500">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No students found.</div>
                ) : (
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Roll No</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Admission No</th>
                                <th className="px-6 py-3">Father Name</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-mono text-gray-600">{student.roll_no || '-'}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{student.student_name}</td>
                                    <td className="px-6 py-3 text-gray-500">{student.admission_no}</td>
                                    <td className="px-6 py-3 text-gray-500">{student.father_name}</td>
                                    <td className="px-6 py-3 text-right space-x-2">
                                        <a
                                            href={`/admin/reports/view/${student.id}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded text-xs font-medium hover:bg-indigo-50 transition-colors"
                                        >
                                            View Report
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
