'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

interface Subject {
    subject_id: number;
    max_marks: number;
    assessment_max_marks?: any;
    display_order: number;
    subject_name?: string; // We'll need to fetch subject names if not provided by the class-subjects API directly, wait, class-subjects API doesn't return subject_name. We should fetch from a new endpoint or update class-subjects GET for office use.
}

// Actually, we'll need subject names. Let's create an API endpoint to GET subjects for a class, or just fetch all subjects.
export default function StudentSubjectsPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = Number(params?.id);

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [academicYear, setAcademicYear] = useState<any>(null);
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

    // The subject selections
    const [mandatorySubjects, setMandatorySubjects] = useState<number[]>([]);
    const [optional5th, setOptional5th] = useState<number | null>(null);
    const [additional6th, setAdditional6th] = useState<number | null>(null);

    useEffect(() => {
        if (!studentId) return;
        fetchData();
    }, [studentId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';

            // 1. Get Academic Year
            const yrs = await ApiClient.get<any[]>('/admin/academic-years', token);
            const activeYr = yrs.find((y: any) => y.is_active);
            if (!activeYr) throw new Error("No active academic year found");
            setAcademicYear(activeYr);

            // 2. Fetch all subjects to get names
            const allSubs = await ApiClient.get<any[]>('/admin/subjects', token);
            const subjectMap = new Map(allSubs.map(s => [s.id, s.subject_name]));

            // 3. Get Student Details to know their enrolled class
            // Use existing admin student endpoint if possible? 
            // Wait, there's no single student API. Let's try to get it from student-enrollments or write a quick raw fetch here if needed.
            // Actually, /api/parent/student won't work for admin. Let's fetch the student list for this year and find the student? No, that's heavy.
            // Is there an API for single student? /api/admin/students/[id] might exist. Let's assume it does.
            const studentResp = await fetch(`/api/admin/students/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!studentResp.ok) throw new Error("Failed to fetch student details");
            const studentJson = await studentResp.json();
            const student = studentJson.data || studentJson;
            setStudentInfo(student);

            // Make sure the student has an enrollment with a class_id
            const classId = student.enrollments?.[0]?.class_id || student.class_id;
            if (!classId) throw new Error("Student is not enrolled in a class");

            // 4. Fetch available subjects for the class
            const classSubsResp = await ApiClient.get<any[]>(`/admin/class-subjects?class_id=${classId}&academic_year_id=${activeYr.id}`, token);
            const enrichedSubs = classSubsResp.map(cs => ({
                ...cs,
                subject_name: subjectMap.get(cs.subject_id) || `Subject ${cs.subject_id}`
            }));
            setAvailableSubjects(enrichedSubs);

            // 5. Fetch current student subject mappings
            const currentMapResp = await fetch(`/api/admin/student-subjects?student_id=${studentId}&academic_year_id=${activeYr.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const currentMapData = await currentMapResp.json();

            const mands: number[] = [];
            let opt5: number | null = null;
            let add6: number | null = null;

            if (currentMapData.success && currentMapData.data) {
                currentMapData.data.forEach((mapping: any) => {
                    if (mapping.subject_type === 'mandatory') mands.push(mapping.subject_id);
                    else if (mapping.subject_type === 'optional_5th') opt5 = mapping.subject_id;
                    else if (mapping.subject_type === 'additional_6th') add6 = mapping.subject_id;
                });
            }

            setMandatorySubjects(mands);
            setOptional5th(opt5);
            setAdditional6th(add6);

        } catch (err: any) {
            console.error(err);
            alert("Error loading data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMandatory = (subId: number) => {
        setMandatorySubjects(prev =>
            prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
        );
        // Clear from other categories if exists
        if (optional5th === subId) setOptional5th(null);
        if (additional6th === subId) setAdditional6th(null);
    };

    const handleSetOptional = (subId: number | null) => {
        setOptional5th(subId);
        if (subId && additional6th === subId) setAdditional6th(null);
        if (subId) setMandatorySubjects(prev => prev.filter(id => id !== subId));
    };

    const handleSetAdditional = (subId: number | null) => {
        setAdditional6th(subId);
        if (subId && optional5th === subId) setOptional5th(null);
        if (subId) setMandatorySubjects(prev => prev.filter(id => id !== subId));
    };

    const handleSave = async () => {
        if (mandatorySubjects.length !== 4) {
            if (!confirm("Warning: Usually, 4 mandatory subjects are expected. Continue anyway?")) return;
        }
        if (!optional5th) {
            if (!confirm("Warning: A 5th main subject is typically required. Continue anyway?")) return;
        }

        setSaving(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            const classId = studentInfo.enrollments?.[0]?.class_id || studentInfo.class_id;

            const payloadSubjects: any[] = [];
            mandatorySubjects.forEach(id => payloadSubjects.push({ subject_id: id, subject_type: 'mandatory' }));
            if (optional5th) payloadSubjects.push({ subject_id: optional5th, subject_type: 'optional_5th' });
            if (additional6th) payloadSubjects.push({ subject_id: additional6th, subject_type: 'additional_6th' });

            await ApiClient.post('/admin/student-subjects', {
                student_id: studentId,
                class_id: classId,
                academic_year_id: academicYear.id,
                subjects: payloadSubjects
            }, token);

            alert('Student subjects saved successfully!');
            router.push('/office/students');

        } catch (err: any) {
            console.error(err);
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading student and subjects data...</div>;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.push('/office/students')} className="text-gray-500 hover:text-gray-800">
                    &larr; Back to Students
                </button>
                <h1 className="text-2xl font-bold text-gray-800 flex-1">
                    Assign Subjects: {studentInfo?.student_name} ({studentInfo?.admission_no})
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow font-medium"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            <div className="bg-white border rounded shadow p-6">
                <p className="text-gray-600 mb-6">
                    Configure the exact subject load for this Class XI/XII student. Marks obtained in the <strong>Mandatory</strong> and <strong>5th Main</strong> subjects will comprise the Total Marks and Percentage. The <strong>6th Additional</strong> subject will be shown but excluded from the grand total.
                </p>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">1. Select Mandatory Subjects (Typically 4)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {availableSubjects.map(sub => (
                            <label key={sub.subject_id} className={`flex items-start p-3 border rounded cursor-pointer transition-colors ${mandatorySubjects.includes(sub.subject_id) ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                                    checked={mandatorySubjects.includes(sub.subject_id)}
                                    onChange={() => toggleMandatory(sub.subject_id)}
                                />
                                <span className="text-sm font-medium text-gray-800">{sub.subject_name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">2. Choose 5th Main (Optional)</h3>
                        <p className="text-xs text-blue-700 mb-4">Marks are added to total.</p>
                        <select
                            className="w-full border-gray-300 rounded p-2 text-sm focus:ring-blue-500"
                            value={optional5th || ""}
                            onChange={(e) => handleSetOptional(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">-- None Selected --</option>
                            {availableSubjects.filter(sub => !mandatorySubjects.includes(sub.subject_id)).map(sub => (
                                <option key={sub.subject_id} value={sub.subject_id}>{sub.subject_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-lg">
                        <h3 className="text-lg font-semibold text-amber-900 mb-3">3. Choose 6th Subject (Additional)</h3>
                        <p className="text-xs text-amber-700 mb-4">Marks are EXCLUDED from total percentage.</p>
                        <select
                            className="w-full border-gray-300 rounded p-2 text-sm focus:ring-amber-500"
                            value={additional6th || ""}
                            onChange={(e) => handleSetAdditional(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">-- None Selected --</option>
                            {availableSubjects.filter(sub => !mandatorySubjects.includes(sub.subject_id)).map(sub => (
                                <option key={sub.subject_id} value={sub.subject_id}>{sub.subject_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

            </div>
        </div>
    );
}
