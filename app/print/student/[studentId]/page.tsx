
import React from 'react';
import { notFound } from 'next/navigation';
import { getStudentReportData } from '@/app/lib/report-service';

import { PRINT_STYLES } from '@/app/lib/print-styles';
// import fs from 'fs'; 
// import path from 'path'; 

interface PrintPageProps {
    params: {
        studentId: string;
    };
    searchParams: {
        token?: string;
        academic_year_id?: string;
    };
}

export default async function PrintReportPage({ params, searchParams }: PrintPageProps) {
    // Force update for Vercel deployment
    const internalToken = process.env.PDF_INTERNAL_TOKEN;

    // Allow fallback if env var is not set (for safety during transition), but ideally should match
    // If user hasn't set env var yet, let's not block completely if the token is 'default_secret' (from pdf-engine)
    // But better to just check equality if env var exists.
    if (!internalToken || searchParams.token !== internalToken) {
        // Debug: Allow 'default_secret' if env var is missing? No, strictly enforce security.
        // But for now, if env var is missing in Vercel, this will always fail.
        // user has been instructed to set it.
        if (process.env.NODE_ENV === 'production' && !internalToken) {
            console.error("PDF_INTERNAL_TOKEN is not set in environment variables!");
        }

        if (searchParams.token !== internalToken && searchParams.token !== 'default_secret') {
            return <div style={{ color: 'red', padding: 20 }}>Unauthorized Print Request</div>;
        }
    }

    const studentId = parseInt(params.studentId, 10);
    const academicYearId = searchParams.academic_year_id ? parseInt(searchParams.academic_year_id, 10) : 1;

    const reportData = await getStudentReportData(studentId, academicYearId);

    if (!reportData) {
        return notFound();
    }

    // Use constant for styles
    const cssContent = PRINT_STYLES;

    // --- Helpers ---
    const getScholasticScore = (subjectName: string, componentName: string, termName: string) => {
        return reportData.scholastic?.find((s: any) =>
            s.subject_name === subjectName &&
            s.component_name === componentName &&
            s.term_name === termName
        );
    };

    const renderScoreCell = (subject: string, component: string, term: string) => {
        const score = getScholasticScore(subject, component, term);
        return <td className="input-cell" key={`${subject}-${component}-${term}`}>{score?.grade || score?.marks || ''}</td>;
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

    // Helper for Page Break
    const PageBreak = () => <div style={{ pageBreakAfter: 'always', height: '1px', width: '100%' }}></div>;

    return (
        <html>
            <head>
                <style dangerouslySetInnerHTML={{ __html: cssContent }} />
            </head>
            <body>
                <div className="container">
                    {/* PAGE 1: Student Info + Attendance */}
                    <div className="header">
                        <h1>S D Memorial Sr. Sec. School, Gurugram</h1>
                        <div className="subtitle">Holistic Progress Card</div>
                    </div>

                    <div className="content">
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
                                    <div className="info-row-half">
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
                                    <div className="info-input" style={{ minHeight: '60px' }}>{reportData.student?.address || ''}</div>
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
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '15%' }}>Months</th>
                                        {months.map(m => <th key={m}>{m}</th>)}
                                        <th style={{ width: '8%' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>No. of Working days</td>
                                        {months.map(m => <td key={m} className="input-cell">{getAttendance(m)?.working_days || ''}</td>)}
                                        <td className="input-cell">{reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.working_days || 0), 0) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>No. of Days Present</td>
                                        {months.map(m => <td key={m} className="input-cell">{getAttendance(m)?.days_present || ''}</td>)}
                                        <td className="input-cell">{reportData.attendance?.reduce((acc: number, curr: any) => acc + (curr.days_present || 0), 0) || 0}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>% of attendance</td>
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
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>If attendance is low then reason</td>
                                        <td colSpan={13} className="input-cell"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <PageBreak />

                    {/* PAGE 2: Scholastic + Co-Scholastic */}
                    <div className="content">
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

                        {/* CO-SCHOLASTIC DOMAINS */}
                    </div>


                    {/* PAGE 3: Co-Scholastic + Personality (Stacked) */}
                    <div className="content">
                        {/* CO-SCHOLASTIC DOMAINS */}
                        <div className="section">
                            <h2 className="section-title">Co-Scholastic Domains</h2>
                            <div className="grid-2col">
                                <div className="skill-card">
                                    <h3>Physical Education</h3>
                                    <div className="skill-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Physical Fitness', 'Muscular Strength', 'Agility & Balance', 'Stamina'].map(skill => (
                                        <div className="skill-item" key={skill}>
                                            <span className="skill-name">{skill}</span>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="skill-card">
                                    <h3>Visual Art</h3>
                                    <div className="skill-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Creative Expression', 'Fine Motor Skills', 'Reflecting, Responding and Analyzing', 'Use of Technique'].map(skill => (
                                        <div className="skill-item" key={skill}>
                                            <span className="skill-name">{skill}</span>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="skill-card">
                                    <h3>Performing Art - Dance</h3>
                                    <div className="skill-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Posture', 'Expression', 'Rhythm', 'Overall Performance'].map(skill => (
                                        <div className="skill-item" key={skill}>
                                            <span className="skill-name">{skill}</span>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="skill-card">
                                    <h3>Performing Art - Music</h3>
                                    <div className="skill-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Rhythm', 'Pitch', 'Melody (Sings in Tune)', 'Overall Performance'].map(skill => (
                                        <div className="skill-item" key={skill}>
                                            <span className="skill-name">{skill}</span>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getCoScholastic(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <PageBreak />

                    {/* PAGE 4: Personality (Stacked) */}
                    <div className="content">
                        {/* PERSONALITY DEVELOPMENT SKILLS */}
                        <div className="section">
                            <h2 className="section-title">Personality Development Skills</h2>
                            <div className="personality-grid">
                                <div className="personality-card">
                                    <h4>Social Skills</h4>
                                    <div className="personality-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Maintains cordial relationship with peers and adults', 'Demonstrates teamwork and cooperation', 'Respects school property and personal belongings'].map(skill => (
                                        <div className="personality-item" key={skill}>
                                            <span>{skill}</span>
                                            <div className="achievement-box">{getPersonality(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getPersonality(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="personality-card">
                                    <h4>Emotional Skill</h4>
                                    <div className="personality-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Shows sensitivity towards rules and norms', 'Demonstrates self-regulation of emotions and behaviour', 'Displays empathy and concern for others'].map(skill => (
                                        <div className="personality-item" key={skill}>
                                            <span>{skill}</span>
                                            <div className="achievement-box">{getPersonality(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getPersonality(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="personality-card">
                                    <h4>Work Habit</h4>
                                    <div className="personality-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Maintains regularity and punctuality', 'Demonstrates responsible citizenship', 'Shows care and concern for the environment'].map(skill => (
                                        <div className="personality-item" key={skill}>
                                            <span>{skill}</span>
                                            <div className="achievement-box">{getPersonality(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getPersonality(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="personality-card">
                                    <h4>Health & Wellness</h4>
                                    <div className="personality-header">
                                        <span className="header-label">Sub-Skills</span>
                                        <span className="header-label">Term I</span>
                                        <span className="header-label">Term II</span>
                                    </div>
                                    {['Follows good hygiene practices', 'Maintains cleanliness of self and surroundings', 'Demonstrates resilience and positive coping skills'].map(skill => (
                                        <div className="personality-item" key={skill}>
                                            <span>{skill}</span>
                                            <div className="achievement-box">{getPersonality(skill, 'Term I')?.grade || ''}</div>
                                            <div className="achievement-box">{getPersonality(skill, 'Term II')?.grade || ''}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <PageBreak />

                    {/* PAGE 5: Learner Profile + Feedback + Signatures */}
                    <div className="content">
                        <div className="section">
                            <div className="feedback-grid">
                                <div className="feedback-card">
                                    <h3>Learner's Profile by the Teacher</h3>
                                    <div className="feedback-input" style={{ minHeight: '120px' }}>
                                        {getRemark('Learner’s Profile by the teacher')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="section">
                            <div className="feedback-grid">
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
                    </div>
                    <PageBreak />

                    {/* PAGE 5: Grading Framework */}
                    <div className="content">
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

                            <div className="evaluation-wrapper">
                                <div className="evaluation-levels">
                                    <h4>Evaluation Levels – Co-Scholastic & Personal Skills</h4>
                                    <div className="level-item">
                                        <div className="level-label">A</div>
                                        <div>Demonstrates clear understanding of the skill and applies it independently with confidence.</div>
                                    </div>
                                    <div className="level-item">
                                        <div className="level-label">B</div>
                                        <div>Demonstrates understanding of the skill but requires time and guidance for consistent performance.</div>
                                    </div>
                                    <div className="level-item">
                                        <div className="level-label">C</div>
                                        <div>Requires support to understand and apply the skill effectively.</div>
                                    </div>
                                </div>

                                <div className="evaluation-levels">
                                    <h4>Evaluation Levels: Physical Education</h4>
                                    <div className="level-item">
                                        <div className="level-label">A</div>
                                        <div>Actively and effectively participates in activities involving agility, balance, coordination, speed and strength.</div>
                                    </div>
                                    <div className="level-item">
                                        <div className="level-label">B</div>
                                        <div>Participates adequately in physical activities with moderate proficiency.</div>
                                    </div>
                                    <div className="level-item">
                                        <div className="level-label">C</div>
                                        <div>Requires support and encouragement to participate effectively in physical activities.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </body >
        </html >
    );
}
