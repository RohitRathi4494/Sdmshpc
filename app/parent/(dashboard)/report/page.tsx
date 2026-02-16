'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRINT_STYLES } from '@/app/lib/print-styles';

// Helper types
interface ReportData {
    student: any;
    scholastic: any[];
    co_scholastic: any[];
    attendance: any[];
    remarks: any[];
}

export default function ParentReportPage() {
    const router = useRouter();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const token = localStorage.getItem('hpc_parent_token');
                if (!token) {
                    console.log("No token, redirecting");
                    router.push('/parent/login');
                    return;
                }

                // 1. Get Student Session
                const studentRes = await fetch('/api/parent/student', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!studentRes.ok) {
                    throw new Error('Failed to fetch student session');
                }

                const studentData = await studentRes.json();
                console.log("Student Data Fetched:", studentData);

                const studentId = studentData?.data?.student?.id;
                const yearId = studentData?.data?.academicYear?.id;

                if (!studentId || !yearId) {
                    throw new Error("Missing student or year data");
                }

                // 2. Fetch Report Data
                const reportRes = await fetch(`/api/reports/student/${studentId}?academic_year_id=${yearId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!reportRes.ok) {
                    const err = await reportRes.json();
                    throw new Error(err.message || 'Failed to fetch report');
                }

                const reportJson = await reportRes.json();
                console.log("Report Data Fetched:", reportJson);

                if (!reportJson.data) {
                    throw new Error("Report data is empty");
                }

                setReportData(reportJson.data);

            } catch (err: any) {
                console.error("Error fetching report:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [router]);


    if (loading) return <div className="p-8 text-center text-gray-500">Loading report card...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!reportData) return <div className="p-8 text-center text-gray-500">No report data found.</div>;

    // --- Helpers (Duplicated from Print Page for consistency) ---
    const getScholasticScore = (subjectName: string, componentName: string, termName: string) => {
        return reportData.scholastic?.find((s: any) =>
            s.subject_name === subjectName &&
            s.component_name === componentName &&
            s.term_name === termName
        );
    };

    const renderScoreCell = (subject: string, component: string, term: string) => {
        const score = getScholasticScore(subject, component, term);
        return <td className="input-cell" key={`${subject}-${component}-${term}`}>{score?.marks ?? ''}</td>;
    };

    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const getAttendance = (month: string) => reportData.attendance?.find((a: any) => a.month_name?.startsWith(month));

    const getCoScholastic = (subSkill: string, term: string) => {
        return reportData.co_scholastic?.find((cs: any) => cs.sub_skill_name === subSkill && cs.term_name === term);
    };

    const getPersonality = (subSkill: string, term: string) => {
        return reportData.co_scholastic?.find((cs: any) => cs.sub_skill_name === subSkill && cs.term_name === term);
    };

    const getRemark = (type: string) => {
        return reportData.remarks?.find((r: any) => r.type_name === type)?.remark_text || '';
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8 px-4 sm:px-8">
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

            <div className="max-w-6xl mx-auto mb-8 bg-white shadow-lg rounded-xl overflow-hidden">
                {/* Back Button */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white no-print">
                    <button
                        onClick={() => router.push('/parent')}
                        className="flex items-center hover:bg-blue-700 px-3 py-1 rounded transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="font-semibold">View Only Mode</div>
                </div>

                {/* Report Content Wrapper */}
                <div className="content p-8 overflow-x-auto">
                    {/* Header with Logo */}
                    <div className="header">
                        <img src="/school_logo.png" className="header-logo" alt="School Logo" />
                        <div className="header-text">
                            <h1>S D Memorial Sr. Sec. School, Gurugram</h1>
                            <div className="subtitle">Holistic Progress Card</div>
                        </div>
                    </div>

                    {/* GENERAL INFORMATION */}
                    <div className="section">
                        <h2 className="section-title">General Information</h2>
                        <div className="info-grid">
                            <div className="info-row">
                                <div className="info-label">Student Name:</div>
                                <div className="info-input">{reportData.student?.student_name}</div>
                            </div>
                            <div className="info-row-split">
                                <div className="info-row-half">
                                    <div className="info-label">Roll No.:</div>
                                    <div className="info-input">{reportData.student?.roll_no}</div>
                                </div>
                                <div className="info-row-compact">
                                    <div className="info-label">Adm No.:</div>
                                    <div className="info-input">{reportData.student?.admission_no}</div>
                                </div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Class / Section:</div>
                                <div className="info-input">{reportData.student?.class_name} - {reportData.student?.section_name}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Date of Birth:</div>
                                <div className="info-input">{reportData.student?.dob ? new Date(reportData.student.dob).toLocaleDateString("en-GB") : ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Address:</div>
                                <div className="info-input" style={{ minHeight: '40px' }}>{reportData.student?.address || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Phone:</div>
                                <div className="info-input">{reportData.student?.phone || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Mother/Guardian Name:</div>
                                <div className="info-input">{reportData.student?.mother_name || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label">Father/Guardian Name:</div>
                                <div className="info-input">{reportData.student?.father_name || ''}</div>
                            </div>
                        </div>
                    </div>

                    {/* ATTENDANCE RECORD */}
                    <div className="section">
                        <h2 className="section-title">Attendance Record</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Months</th>
                                        {months.map(m => <th key={m}>{m}</th>)}
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>No. of Working days</td>
                                        {months.map(m => <td key={m} className="input-cell">{getAttendance(m)?.working_days || ''}</td>)}
                                        <td className="input-cell">{reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.working_days || 0), 0) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>No. of Days Present</td>
                                        {months.map(m => <td key={m} className="input-cell">{getAttendance(m)?.days_present || ''}</td>)}
                                        <td className="input-cell">{reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.days_present || 0), 0) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>% of attendance</td>
                                        {months.map(m => {
                                            const att = getAttendance(m);
                                            return <td key={m} className="input-cell">{att && att.working_days ? Math.round((att.days_present / att.working_days) * 100) : ''}</td>;
                                        })}
                                        <td className="input-cell">
                                            {(() => {
                                                const totalW = reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.working_days || 0), 0) || 0;
                                                const totalP = reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.days_present || 0), 0) || 0;
                                                return totalW ? Math.round((totalP / totalW) * 100) + '%' : '';
                                            })()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600 }}>If attendance is low then reason</td>
                                        <td colSpan={13} className="input-cell"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SCHOLASTIC DOMAINS */}
                    <div className="section">
                        <h2 className="section-title">Scholastic Domains</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th rowSpan={2}>Subjects</th>
                                    <th colSpan={2}>Periodic Assessment</th>
                                    <th colSpan={2}>Subject Enrichment Activities</th>
                                    <th colSpan={2}>Internal Assessment</th>
                                    <th colSpan={2}>Terminal Assessment</th>
                                </tr>
                                <tr>
                                    <th>Term I</th>
                                    <th>Term II</th>
                                    <th>Term I</th>
                                    <th>Term II</th>
                                    <th>Term I</th>
                                    <th>Term II</th>
                                    <th>Term I</th>
                                    <th>Term II</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    'English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'ICT', 'Sanskrit', 'General Knowledge'
                                ].map(subject => (
                                    <tr key={subject}>
                                        <td className="subject-name">{subject}</td>
                                        {renderScoreCell(subject, 'Periodic Assessment', 'Term I')}
                                        {renderScoreCell(subject, 'Periodic Assessment', 'Term II')}
                                        {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term I')}
                                        {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term II')}
                                        {renderScoreCell(subject, 'Internal Assessment', 'Term I')}
                                        {renderScoreCell(subject, 'Internal Assessment', 'Term II')}
                                        {renderScoreCell(subject, 'Terminal Assessment', 'Term I')}
                                        {renderScoreCell(subject, 'Terminal Assessment', 'Term II')}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PHYSICAL EDUCATION (Split from Co-Scholastic) */}
                    <div className="section">
                        <h2 className="section-title">Co-Scholastic Domains</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                    <th style={{ width: '25%' }}>Term I</th>
                                    <th style={{ width: '25%' }}>Term II</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Physical Education */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Physical Education</td>
                                </tr>
                                {['Physical Fitness', 'Muscular Strength', 'Agility & Balance', 'Stamina'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tbody>
                                {/* Visual Art */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Visual Art</td>
                                </tr>
                                {['Creative Expression', 'Fine Motor Skills', 'Reflecting, Responding and Analyzing', 'Use of Technique'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* CO-SCHOLASTIC DOMAINS (Remaining) */}
                    <div className="section compact-section">
                        <h2 className="section-title">Co-Scholastic Domains</h2>
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                    <th style={{ width: '25%' }}>Term I</th>
                                    <th style={{ width: '25%' }}>Term II</th>
                                </tr>
                            </thead>
                            <tbody>

                                {/* Performing Art - Dance */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Performing Art - Dance</td>
                                </tr>
                                {['Posture', 'Expression', 'Rhythm', 'Overall Performance'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}

                                {/* Performing Art - Music */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Performing Art - Music</td>
                                </tr>
                                {['Rhythm', 'Pitch', 'Melody (Sings in Tune)', 'Overall Performance'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PERSONALITY DEVELOPMENT SKILLS */}
                    <div className="section compact-section">
                        <h2 className="section-title">Personality Development Skills</h2>
                        <table className="compact-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                    <th style={{ width: '25%' }}>Term I</th>
                                    <th style={{ width: '25%' }}>Term II</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Social Skills */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Social Skills</td>
                                </tr>
                                {['Maintains cordial relationship with peers and adults', 'Demonstrates teamwork and cooperation', 'Respects school property and personal belongings'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}

                                {/* Emotional Skills */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Emotional Skills</td>
                                </tr>
                                {['Shows sensitivity towards rules and norms', 'Demonstrates self-regulation of emotions and behaviour', 'Displays empathy and concern for others'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}

                                {/* Work Habit */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Work Habit</td>
                                </tr>
                                {['Maintains regularity and punctuality', 'Demonstrates responsible citizenship', 'Shows care and concern for the environment'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}

                                {/* Health & Wellness */}
                                <tr>
                                    <td colSpan={3} className="subject-header" style={{ fontWeight: 700, background: 'rgba(232, 241, 245, 0.4)', textAlign: 'center' }}>Health & Wellness</td>
                                </tr>
                                {['Follows good hygiene practices', 'Maintains cleanliness of self and surroundings', 'Demonstrates resilience and positive coping skills'].map(skill => (
                                    <tr key={skill}>
                                        <td style={{ textAlign: 'left', paddingLeft: '15px' }}>{skill}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                        <td className="input-cell">{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* FEEDBACK SECTIONS */}
                    <div className="section">
                        <div className="feedback-grid">
                            <div className="feedback-card">
                                <h3>Learner's Profile by the Teacher</h3>
                                <div className="feedback-input" style={{ minHeight: '120px' }}>
                                    {getRemark('Learner’s Profile by the teacher')}
                                </div>
                            </div>

                            <div className="feedback-card">
                                <h3>Parent's Feedback</h3>
                                {['My child enjoys participating in...', 'My child can be supported for...', 'Any additional observations'].map(label => (
                                    <div className="feedback-row" key={label}>
                                        <div className="feedback-label">{label}</div>
                                        <div className="feedback-input">{getRemark(`Parent's Feedback - ${label}`)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Self Assessment */}
                            <div className="feedback-card">
                                <h3>Self-Assessment</h3>
                                {['Activities I enjoy the most', 'Activities I find challenging', 'Activities I enjoy doing with my friends'].map(label => (
                                    <div className="feedback-row" key={label}>
                                        <div className="feedback-label">{label}</div>
                                        <div className="feedback-input">{getRemark(`Self Assessment - ${label}`)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIGNATURE SECTION */}
                    <div className="signature-section">
                        {['Class Teacher', 'Parents', 'Block Incharge', 'Vice Principal', 'Principal'].map(role => (
                            <div className="signature-box" key={role}>
                                <div className="signature-line"></div>
                                <div className="signature-label">{role}</div>
                            </div>
                        ))}
                    </div>

                    {/* GRADING FRAMEWORK */}
                    <div className="grading-section">
                        <h3>Assessment & Grading Framework</h3>
                        <div className="grading-grid">
                            <div className="grading-cell grading-header">Grade</div>
                            <div className="grading-cell grading-header">Marks Range in %</div>
                            <div className="grading-cell grading-header">Achievement Level</div>

                            <div className="grading-cell grade-label">A1</div>
                            <div className="grading-cell grade-range">91-100</div>
                            <div className="grading-cell">Consistently produces high-quality, innovative work; demonstrates comprehensive conceptual understanding, critical and creative thinking, and independent application of knowledge in complex situations.</div>

                            <div className="grading-cell grade-label">A2</div>
                            <div className="grading-cell grade-range">81 – 90</div>
                            <div className="grading-cell">Produces high-quality work; shows extensive understanding of concepts and applies learning independently in familiar and unfamiliar situations.</div>

                            <div className="grading-cell grade-label">B1</div>
                            <div className="grading-cell grade-range">71 – 80</div>
                            <div className="grading-cell">Produces generally high-quality work; demonstrates secure understanding and applies knowledge with occasional support.</div>

                            <div className="grading-cell grade-label">B2</div>
                            <div className="grading-cell grade-range">61 – 70</div>
                            <div className="grading-cell">Produces good quality work; shows basic understanding and requires support in unfamiliar situations.</div>

                            <div className="grading-cell grade-label">C1</div>
                            <div className="grading-cell grade-range">51 – 60</div>
                            <div className="grading-cell">Produces acceptable work; shows basic understanding with gaps and requires regular support.</div>

                            <div className="grading-cell grade-label">C2</div>
                            <div className="grading-cell grade-range">41 – 50</div>
                            <div className="grading-cell">Produces limited quality work; demonstrates significant conceptual gaps and minimal application skills.</div>

                            <div className="grading-cell grade-label">D</div>
                            <div className="grading-cell grade-range">33 – 40</div>
                            <div className="grading-cell">Produces very limited work; shows inadequate understanding of concepts.</div>

                            <div className="grading-cell grade-label">E</div>
                            <div className="grading-cell grade-range">33 & below</div>
                            <div className="grading-cell">Not yet assessed / Needs improvement</div>
                        </div>

                        {/* EVALUATION LEVELS */}
                        <div className="section compact-section">
                            <h2 className="section-title">Evaluation Levels – Co-Scholastic & Personal Skills</h2>
                            <table className="compact-table">
                                <tbody>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700, width: '50px' }}>A</td>
                                        <td style={{ textAlign: 'left' }}>Demonstrates clear understanding of the skill and applies it independently with confidence.</td>
                                    </tr>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700 }}>B</td>
                                        <td style={{ textAlign: 'left' }}>Demonstrates understanding of the skill but requires time and guidance for consistent performance.</td>
                                    </tr>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700 }}>C</td>
                                        <td style={{ textAlign: 'left' }}>Requires support to understand and apply the skill effectively.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="section compact-section">
                            <h2 className="section-title">Evaluation Levels: Physical Education</h2>
                            <table className="compact-table">
                                <tbody>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700, width: '50px' }}>A</td>
                                        <td style={{ textAlign: 'left' }}>Actively and effectively participates in activities involving agility, balance, coordination, speed and strength.</td>
                                    </tr>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700 }}>B</td>
                                        <td style={{ textAlign: 'left' }}>Participates adequately in physical activities with moderate proficiency.</td>
                                    </tr>
                                    <tr style={{ background: 'var(--light-cream)' }}>
                                        <td style={{ fontWeight: 700 }}>C</td>
                                        <td style={{ textAlign: 'left' }}>Requires support and encouragement to participate effectively in physical activities.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
