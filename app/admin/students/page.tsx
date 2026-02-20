'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import StudentImporter from '@/app/components/StudentImporter';
import Modal from '@/app/components/ui/Modal';
import StudentForm from '@/app/components/StudentForm';

// Types
interface Student {
    id: number;
    admission_no: string;
    student_name: string;
    father_name: string;
    mother_name?: string;
    dob?: string;
    // ... other fields are optional in list view
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

export default function StudentsPage() {
    const [activeTab, setActiveTab] = useState<'enroll' | 'import' | 'list'>('enroll');
    const [students, setStudents] = useState<Student[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]); // For list view
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);

    const [loading, setLoading] = useState(false);

    // Enrollment State
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [enrolling, setEnrolling] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // List View State
    const [filterClassId, setFilterClassId] = useState<number | null>(null);
    const [filterSectionId, setFilterSectionId] = useState<number | null>(null);

    // Load Masters
    useEffect(() => {
        const fetchMasters = async () => {
            const token = localStorage.getItem('hpc_token') || '';
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

    // Fetch Unenrolled Students
    const fetchUnenrolled = async () => {
        if (!academicYear) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            const data = await ApiClient.get<Student[]>(`/admin/students?status=unenrolled&academic_year_id=${academicYear.id}`, token);
            setStudents(data);
            setSelectedStudents([]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Enrolled Students for List View
    const fetchEnrolled = async () => {
        if (!academicYear || !filterClassId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            let url = `/admin/students?class_id=${filterClassId}&academic_year_id=${academicYear.id}`;
            if (filterSectionId) url += `&section_id=${filterSectionId}`;

            const data = await ApiClient.get<any[]>(url, token);
            setEnrolledStudents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'enroll' && academicYear) {
            fetchUnenrolled();
        }
    }, [activeTab, academicYear]);

    useEffect(() => {
        if (activeTab === 'list' && filterClassId) {
            fetchEnrolled();
        } else if (activeTab === 'list') {
            setEnrolledStudents([]);
        }
    }, [activeTab, filterClassId, filterSectionId, academicYear]);

    const handleEnroll = async () => {
        if (!selectedClassId || !selectedSectionId || selectedStudents.length === 0 || !academicYear) {
            alert('Please select class, section and students');
            return;
        }

        if (!confirm(`Enroll ${selectedStudents.length} students into Class?`)) return;

        setEnrolling(true);
        try {
            const token = localStorage.getItem('hpc_token') || '';
            const promises = selectedStudents.map(studentId =>
                ApiClient.post('/admin/student-enrollments', {
                    student_id: studentId,
                    class_id: selectedClassId,
                    section_id: selectedSectionId,
                    academic_year_id: academicYear.id
                }, token)
            );

            await Promise.all(promises);
            alert('Enrollment successful');
            fetchUnenrolled();
            setSelectedStudents([]);

        } catch (error: any) {
            alert('Enrollment failed: ' + error.message);
        } finally {
            setEnrolling(false);
        }
    };

    const handleCreateStudent = async (studentData: any) => {
        if (!academicYear) return;
        try {
            const token = localStorage.getItem('hpc_token') || '';

            // StudentForm returns proper types, but we might need to attach academic_year_id
            await ApiClient.post('/admin/students', {
                ...studentData,
                // Ensure class_id is derived from section_id if not present? 
                // Wait, POST /admin/students expects class_id. 
                // If we select section in form, we must find class.
                class_id: sections.find(s => s.id === studentData.section_id)?.class_id,
                academic_year_id: academicYear.id
            }, token);

            alert('Student added successfully!');
            setIsAddModalOpen(false);
            if (activeTab === 'enroll') fetchUnenrolled();
            if (activeTab === 'list' && filterClassId) fetchEnrolled();
        } catch (error: any) {
            alert('Failed to add student: ' + error.message);
        }
    };

    const toggleStudent = (id: number) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const filteredSections = sections.filter(s => s.class_id === selectedClassId);

    const router = useRouter();

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
                <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
            </div>
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('enroll')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'enroll' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Enroll New Students
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'list' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    View Students
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'import' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Import Students
                </button>
            </div>

            {activeTab === 'import' && (
                <StudentImporter onImportSuccess={() => setActiveTab('list')} />
            )}

            {activeTab === 'list' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded shadow border border-gray-100 flex gap-4 items-center">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
                            <select
                                value={filterClassId || ''}
                                onChange={e => { setFilterClassId(Number(e.target.value)); setFilterSectionId(null); }}
                                className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Filter by Section:</label>
                            <select
                                value={filterSectionId || ''}
                                onChange={e => setFilterSectionId(e.target.value ? Number(e.target.value) : null)}
                                disabled={!filterClassId}
                                className="border border-gray-300 rounded px-3 py-2 text-sm w-48 disabled:bg-gray-100"
                            >
                                <option value="">All Sections</option>
                                {classes.length > 0 && filterClassId && sections
                                    .filter(s => s.class_id === filterClassId)
                                    .map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)
                                }
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-semibold text-gray-700">
                                Enrolled Students {filterClassId ? `(${enrolledStudents.length})` : ''}
                            </h3>
                            {filterClassId && enrolledStudents.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to re-assign roll numbers alphabetically for this class? Existing roll numbers will be overwritten.')) return;
                                        setLoading(true);
                                        try {
                                            const token = sessionStorage.getItem('hpc_token') || '';
                                            await ApiClient.post('/admin/students/auto-roll-no', {
                                                class_id: filterClassId,
                                                academic_year_id: academicYear?.id
                                            }, token);
                                            alert('Roll numbers assigned successfully');
                                            fetchEnrolled();
                                        } catch (e: any) {
                                            alert('Failed: ' + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 border border-indigo-200 font-medium transition-colors"
                                >
                                    Auto-Assign Roll No
                                </button>
                            )}
                        </div>

                        {!filterClassId ? (
                            <div className="p-8 text-center text-gray-500">Please select a class to view students.</div>
                        ) : loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : enrolledStudents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No students found in this class.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 whitespace-nowrap">Roll No</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Admission No</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Name</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Father Name</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Mother Name</th>
                                            <th className="px-6 py-3 whitespace-nowrap">DOB</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Section</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {enrolledStudents.map((student) => {
                                            const sec = sections.find(s => s.id === student.section_id);
                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{student.roll_no || '-'}</td>
                                                    <td className="px-6 py-3 font-mono text-gray-600 whitespace-nowrap">{student.admission_no}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{student.student_name}</td>
                                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{student.father_name}</td>
                                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{student.mother_name || '-'}</td>
                                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{student.dob ? new Date(student.dob).toLocaleDateString() : '-'}</td>
                                                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                                        {sec ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{sec.section_name}</span> : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <button
                                                            onClick={() => setEditingStudent(student)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50"
                                                        >
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={!!editingStudent}
                onClose={() => setEditingStudent(null)}
                title="Edit Student Details"
                maxWidth="max-w-4xl"
            >
                {editingStudent && (
                    <StudentForm
                        student={editingStudent}
                        classes={classes}
                        sections={sections}
                        academicYearId={academicYear?.id}
                        onSave={async (updatedData: any) => {
                            try {
                                const token = sessionStorage.getItem('hpc_token') || '';
                                await ApiClient.put(`/admin/students/${editingStudent.id}`, updatedData, token);
                                alert('Student updated successfully');
                                setEditingStudent(null);
                                fetchEnrolled(); // Refresh list
                            } catch (e: any) {
                                alert('Update failed: ' + e.message);
                            }
                        }}
                        onCancel={() => setEditingStudent(null)}
                    />
                )}
            </Modal>

            {activeTab === 'enroll' && (
                <div className="space-y-6">
                    {/* Add Single Student Header */}
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded border border-gray-200">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Enrollment Actions</h3>
                            <p className="text-sm text-gray-500">Add new students individually or enroll existing ones.</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                        >
                            <span>+</span> Add Single Student
                        </button>
                    </div>

                    {/* Enrollment Controls */}
                    <div className="bg-white p-4 rounded shadow border border-gray-100 flex gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Class</label>
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
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Section</label>
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
                        <div className="flex-1"></div>
                        <button
                            onClick={handleEnroll}
                            disabled={enrolling || selectedStudents.length === 0}
                            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                        >
                            {enrolling ? 'Enrolling...' : `Enroll Selected (${selectedStudents.length})`}
                        </button>
                    </div>

                    {/* Student List */}
                    <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-700">New / Unenrolled Students ({students.length})</h3>
                            <button onClick={() => setSelectedStudents(students.map(s => s.id))} className="text-xs text-indigo-600 hover:underline">Select All</button>
                        </div>
                        <div className="max-h-[500px] overflow-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Loading students...</div>
                            ) : students.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No unenrolled students found. Import new students to continue.</div>
                            ) : (
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 w-10"></th>
                                            <th className="px-6 py-3">Admission No</th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Father Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {students.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => toggleStudent(student.id)}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 font-mono text-gray-600">{student.admission_no}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{student.student_name}</td>
                                                <td className="px-6 py-3 text-gray-500">{student.father_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Student"
                maxWidth="max-w-4xl"
            >
                <StudentForm
                    student={{}} // Empty for new student
                    classes={classes}
                    sections={sections} // Pass all sections
                    academicYearId={academicYear?.id}
                    onSave={handleCreateStudent}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
