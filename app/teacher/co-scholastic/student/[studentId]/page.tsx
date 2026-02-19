'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';

interface StudentReport {
    co_scholastic: any[];
    student: {
        student_name: string;
        admission_no: string;
    };
}

interface DomainType {
    id: number;
    name: string;
    skills: {
        id: number;
        name: string;
    }[];
}

// Hardcoded scales based on schema, but domain/skills will be fetched
const getScaleForDomain = (domainName: string) => {
    return ['A', 'B', 'C'];
};

export default function CoScholasticEntryPage() {
    const params = useParams();
    const studentId = parseInt(params.studentId as string);
    const router = useRouter();

    const [reportData, setReportData] = useState<StudentReport | null>(null);
    const [domains, setDomains] = useState<DomainType[]>([]);
    const [scores, setScores] = useState<Record<string, string>>({}); // valid grade
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('hpc_token') || undefined;

                // 1. Fetch Metadata (Domains & Skills)
                const metadataRes = await ApiClient.get<{ success: boolean; data: any[] }>('/teacher/co-scholastic-scores/metadata', token);
                // Handle response structure depending on if it's wrapped
                const fetchedDomains = Array.isArray(metadataRes) ? metadataRes : (metadataRes.data || []);
                setDomains(fetchedDomains);

                // 2. Fetch Existing Scores via Report
                const report = await ApiClient.get<StudentReport>(`/reports/student/${studentId}?academic_year_id=1`, token);
                setReportData(report);

                const scoreMap: Record<string, string> = {};
                // Determine IDs from report data
                if (report.co_scholastic) {
                    report.co_scholastic.forEach((s: any) => {
                        // Key: skill_id - term_id
                        scoreMap[`${s.sub_skill_id}-${s.term_id}`] = s.grade;
                    });
                }
                setScores(scoreMap);

            } catch (err: any) {
                console.error("Failed to load data:", err);
                setError(err.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    const handleGradeChange = async (skillId: number, termId: number, grade: string) => {
        const key = `${skillId}-${termId}`;
        const previousGrade = scores[key];

        // Optimistic update
        setScores(prev => ({ ...prev, [key]: grade }));
        setSaving(true);

        try {
            const token = localStorage.getItem('hpc_token') || undefined;
            // Term ID and Academic Year ID need to be correct.
            // Assumption: Academic Year = 1 (Current)
            await ApiClient.post('/teacher/co-scholastic-scores', {
                student_id: studentId,
                sub_skill_id: skillId,
                term_id: termId,
                grade,
                academic_year_id: 1
            }, token);
            setSaving(false);
        } catch (e) {
            console.error("Failed to save grade:", e);
            // Revert on error
            setScores(prev => ({ ...prev, [key]: previousGrade || '' })); // revert to previous or clear
            alert("Failed to save grade. Please check your connection.");
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading student data...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!reportData) return <div className="p-8 text-center">Student not found</div>;

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <button
                onClick={() => router.back()}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
            </button>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    {reportData.student.student_name}
                </h2>
                <div className="text-sm text-gray-500">
                    Admission No: {reportData.student.admission_no}
                    {saving && <span className="ml-2 text-blue-600 animate-pulse font-medium">Saving...</span>}
                </div>
            </div>

            <div className="space-y-8">
                {domains.map((domain) => (
                    <div key={domain.id} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center">
                                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                                {domain.name}
                            </h3>
                        </div>
                        <div className="p-0">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="text-left py-3 px-6 font-semibold text-gray-500 text-xs uppercase tracking-wider w-1/2">
                                            Skill / Indicator
                                        </th>
                                        <th className="text-center font-semibold text-gray-500 text-xs uppercase tracking-wider py-3">Term I</th>
                                        <th className="text-center font-semibold text-gray-500 text-xs uppercase tracking-wider py-3">Term II</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {domain.skills.map((skill) => (
                                        <tr key={skill.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="py-4 px-6 text-sm text-gray-700 font-medium">{skill.name}</td>
                                            {[1, 2].map(termId => (
                                                <td key={termId} className="py-4 px-4 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        {getScaleForDomain(domain.name).map(g => (
                                                            <button
                                                                key={g}
                                                                onClick={() => handleGradeChange(skill.id, termId, g)}
                                                                className={`
                                                                    w-9 h-9 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center border
                                                                    ${scores[`${skill.id}-${termId}`] === g
                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                                                `}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {domains.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No co-scholastic domains found. Please contact admin to seed data.
                </div>
            )}
        </div>
    );
}
