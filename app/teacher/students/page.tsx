'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import { isFoundationalClass } from '@/app/lib/foundational-skills';
import JSZip from 'jszip';

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

    // Bulk Download State
    const [bulkDownloading, setBulkDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string>('');
    const [selectedBulkReportType, setSelectedBulkReportType] = useState<string>('Term I'); // PA1, Term I, etc.

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

    const handleBulkDownload = async () => {
        if (!selectedClassId || filteredStudents.length === 0) {
            alert("No students found to download.");
            return;
        }

        const cls = classes.find(c => c.id.toString() === selectedClassId);
        if (!cls) return;

        const isFoundational = isFoundationalClass(cls.class_name);
        // Foundational doesn't need report type param natively yet, but we pass it anyway or omit it.
        const reportType = isFoundational ? 'Cumulative' : selectedBulkReportType;

        setBulkDownloading(true);
        setDownloadProgress('Starting...');

        try {
            const token = sessionStorage.getItem('hpc_token') || undefined;
            const zip = new JSZip();
            const yearId = 1; // TODO: make dynamic

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < filteredStudents.length; i++) {
                const student = filteredStudents[i];
                setDownloadProgress(`Fetching ${i + 1} of ${filteredStudents.length}: ${student.student_name}...`);

                try {
                    const response = await fetch(`/api/reports/student/${student.id}/pdf`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ academic_year_id: yearId, report_type: reportType })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to generate PDF for ${student.student_name}`);
                    }

                    const blob = await response.blob();
                    // Naming format: Name_AdmissionNo_ReportType.pdf
                    const safeName = student.student_name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, '_');
                    const fileName = `${student.roll_no || student.id}_${safeName}_${student.admission_no.replace(/[^a-zA-Z0-9]/g, '_')}_${reportType.replace(/ /g, '')}.pdf`;

                    zip.file(fileName, blob);
                    successCount++;
                } catch (err) {
                    console.error('Error fetching PDF for student:', student.id, err);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                setDownloadProgress(`Zipping ${successCount} files...`);
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const downloadUrl = window.URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = downloadUrl;

                const secName = selectedSectionId ? cls.sections.find(s => s.id.toString() === selectedSectionId)?.section_name || '' : 'All';
                a.download = `ReportCards_${cls.class_name}_${secName}_${reportType.replace(/ /g, '')}.zip`;

                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                setDownloadProgress(`Complete! (${successCount} generated${errorCount > 0 ? `, ${errorCount} failed` : ''})`);
            } else {
                setDownloadProgress('Failed to generate any PDFs.');
            }

            setTimeout(() => {
                setBulkDownloading(false);
                setDownloadProgress('');
            }, 3000);

        } catch (error: any) {
            console.error('Bulk download error:', error);
            alert(`Failed to bulk download PDFs: ${error.message}`);
            setBulkDownloading(false);
            setDownloadProgress('');
        }
    };

    const selectedClass = classes.find(c => c.id.toString() === selectedClassId);

    if (loading && classes.length === 0) return <div className="p-8 text-center">Loading...</div>;

    if (classes.length === 0 && !loading) {
        return <div className="p-8 text-center text-gray-500">No classes assigned to you.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header / Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
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

                <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <div className="w-full sm:w-auto">
                        <label className="block text-xs text-gray-500 mb-1">Search Student</label>
                        <input
                            type="text"
                            placeholder="Name or Admission No..."
                            className="border p-2 rounded w-full sm:w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {selectedClass && filteredStudents.length > 0 && (
                        <div className="flex gap-2 items-end w-full sm:w-auto bg-blue-50/50 p-2 rounded border border-blue-100">
                            {!isFoundationalClass(selectedClass.class_name) && (
                                <div className="hidden sm:block">
                                    <label className="block text-xs text-blue-800 font-medium mb-1">Report Type</label>
                                    <select
                                        value={selectedBulkReportType}
                                        onChange={(e) => setSelectedBulkReportType(e.target.value)}
                                        className="border-blue-200 p-2 rounded text-sm outline-none w-32 focus:ring-2 focus:ring-blue-500 bg-white"
                                        disabled={bulkDownloading}
                                    >
                                        <option value="PA1">Periodic 1</option>
                                        <option value="Term I">Term I</option>
                                        <option value="PA2">Periodic 2</option>
                                        <option value="Term II">Term II</option>
                                        <option value="Cumulative">Cumulative</option>
                                    </select>
                                </div>
                            )}
                            <button
                                onClick={handleBulkDownload}
                                disabled={bulkDownloading}
                                className={`px-4 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-2 w-full sm:w-auto ${bulkDownloading
                                    ? 'bg-blue-300 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                    }`}
                            >
                                {bulkDownloading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="truncate max-w-[150px]">{downloadProgress}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                        Download All (ZIP)
                                    </>
                                )}
                            </button>
                        </div>
                    )}
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
                                                        className="px-4 py-2 w-full sm:w-auto bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition font-semibold"
                                                        title="HPC Entry"
                                                    >
                                                        🌟 HPC Entry
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/teacher/preview/student/${student.id}`)}
                                                        className="px-4 py-2 w-full sm:w-auto bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
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
                                                        className="px-4 py-2 w-full sm:w-auto bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition font-semibold"
                                                        title="HPC Entry"
                                                    >
                                                        🌟 HPC Entry
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/teacher/preview/student/${student.id}`)}
                                                        className="px-4 py-2 w-full sm:w-auto bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
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
        </div >
    );
}

export default function StudentSelectionPage() {
    return (
        <Suspense fallback={<div>Loading student selection...</div>}>
            <StudentSelectionContent />
        </Suspense>
    );
}
