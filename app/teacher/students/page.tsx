'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import { isFoundationalClass } from '@/app/lib/foundational-skills';

interface Student {
    id: number;
    admission_no: string;
    student_name: string;
    father_name: string;
    roll_no: number;
}

interface ClassData {
    id: number;
    class_name: string;
    sections: {
        id: number;
        section_name: string;
    }[];
}

function StudentSelectionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL Params
    const urlClassId = searchParams.get('class_id');
    const urlSectionId = searchParams.get('section_id');

    // State
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || '');
    const [selectedSectionId, setSelectedSectionId] = useState<string>(urlSectionId || '');

    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // 1. Fetch Classes for the Teacher
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || '';
                const data = await ApiClient.get<ClassData[]>('/teacher/classes', token);
                setClasses(data);

                // Auto-select first class if none selected and data exists
                if (!urlClassId && data.length > 0) {
                    const firstClass = data[0];
                    // If sections exist, pick first section too
                    const firstSectionId = firstClass.sections.length > 0 ? firstClass.sections[0].id.toString() : '';

                    setSelectedClassId(firstClass.id.toString());
                    setSelectedSectionId(firstSectionId);

                    // Update URL without full reload
                    const newUrl = `/teacher/students?class_id=${firstClass.id}${firstSectionId ? `&section_id=${firstSectionId}` : ''}`;
                    router.replace(newUrl);
                }
            } catch (error) {
                console.error('Failed to load classes', error);
            }
        };
        fetchClasses();
    }, []);

    // 2. Sync State with URL changes (e.g. back button)
    useEffect(() => {
        if (urlClassId) setSelectedClassId(urlClassId);
        if (urlSectionId) setSelectedSectionId(urlSectionId);
    }, [urlClassId, urlSectionId]);

    // 3. Fetch Students when selection changes
    useEffect(() => {
        if (!selectedClassId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const fetchStudents = async () => {
            try {
                const token = sessionStorage.getItem('hpc_token') || undefined;
                let url = `/teacher/students?class_id=${selectedClassId}&academic_year_id=1`; // Todo: dynamic year
                if (selectedSectionId) url += `&section_id=${selectedSectionId}`;

                const data = await ApiClient.get<Student[]>(url, token);
                setStudents(data);
                setFilteredStudents(data);
            } catch (error) {
                console.error('Failed to load students', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedClassId, selectedSectionId]);

    // 4. Search Filter
    useEffect(() => {
        const lower = search.toLowerCase();
        setFilteredStudents(students.filter(s =>
            s.student_name.toLowerCase().includes(lower) ||
            s.admission_no.toLowerCase().includes(lower)
        ));
    }, [search, students]);

    // Handlers
    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clsId = e.target.value;
        setSelectedClassId(clsId);

        // Reset section when class changes
        const cls = classes.find(c => c.id.toString() === clsId);
        const firstSec = cls?.sections?.[0]?.id.toString() || '';
        setSelectedSectionId(firstSec);

        router.push(`/teacher/students?class_id=${clsId}${firstSec ? `&section_id=${firstSec}` : ''}`);
    };

    const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const secId = e.target.value;
        setSelectedSectionId(secId);
        router.push(`/teacher/students?class_id=${selectedClassId}&section_id=${secId}`);
    };

    const selectedClass = classes.find(c => c.id.toString() === selectedClassId);

    if (loading && classes.length === 0) return <div className="p-8 text-center">Loading...</div>;

    if (classes.length === 0 && !loading) {
        return <div className="p-8 text-center text-gray-500">No classes assigned to you.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header / Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4 items-center w-full md:w-auto">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Class</label>
                        <select
                            value={selectedClassId}
                            onChange={handleClassChange}
                            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                        >
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedClass && selectedClass.sections.length > 0 && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Section</label>
                            <select
                                value={selectedSectionId}
                                onChange={handleSectionChange}
                                className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            >
                                {selectedClass.sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>{sec.section_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-auto">
                    <label className="block text-xs text-gray-500 mb-1">Search Student</label>
                    <input
                        type="text"
                        placeholder="Name or Admission No..."
                        className="border p-2 rounded w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No students found.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.roll_no || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                                        <div className="text-xs text-gray-500">{student.father_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.admission_no}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2 flex-wrap gap-y-1">
                                            {selectedClass && isFoundationalClass(selectedClass.class_name) ? (
                                                // ── Foundational Stage (Nursery / LKG / UKG) ──
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/teacher/foundational/student/${student.id}?academic_year_id=1`)}
                                                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition font-semibold"
                                                        title="HPC Entry"
                                                    >
                                                        🌟 HPC Entry
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/teacher/preview/student/${student.id}`)}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                                        title="Preview HPC Card"
                                                    >
                                                        Preview
                                                    </button>
                                                </>
                                            ) : (
                                                // ── Regular Classes (III–VIII) ──
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/teacher/scholastic/student/${student.id}`)}
                                                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition font-semibold"
                                                        title="HPC Entry"
                                                    >
                                                        🌟 HPC Entry
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/teacher/preview/student/${student.id}`)}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                                        title="Preview Report"
                                                    >
                                                        Preview
                                                    </button>
                                                </>
                                            )}
                                        </div>
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

export default function StudentSelectionPage() {
    return (
        <Suspense fallback={<div>Loading student selection...</div>}>
            <StudentSelectionContent />
        </Suspense>
    );
}
