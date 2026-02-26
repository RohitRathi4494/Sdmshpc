import React from 'react';

interface ReportData {
    student: any;
    scholastic: any[];
    co_scholastic: any[];
    attendance: any[];
    remarks: any[];
    subjects?: any[];
}
// ── style tokens matching the Foundational Stage HTML reference ──
const C = {
    navy: '#1B3D6F', navyMid: '#244d8a', gold: '#C8922A', goldLight: '#f0c060',
    paleBg: '#F5F8FF', rowOdd: '#FFFFFF', rowEven: '#EFF4FB', border: '#c9d8ee',
    subheadBg: '#dbe8fa', tagA: '#1a7a3b', tagB: '#2563EB', tagC: '#d97706',
    text: '#1a2840', muted: '#4B5563', white: '#FFFFFF',
};

// ── Section Heading Component ──
function SectionHeading({ children, mt }: { children: string; mt?: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: `${mt ?? 22}px 0 6px` }}>
            <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3, flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {children}
            </h3>
        </div>
    );
}

// ── School Header Component ──
function SchoolHeader() {
    return (
        <div style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <div style={{ background: C.navy, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px' }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', border: `2px solid ${C.goldLight}`,
                    background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden'
                }}>
                    <img src="/school_logo.png" alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: C.white, letterSpacing: 0.4 }}>
                        S D MEMORIAL SR. SEC. SCHOOL, GURUGRAM
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.goldLight, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
                        Holistic Progress Card
                    </div>
                </div>
            </div>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }} />
        </div>
    );
}

export default function ReportTemplate_III_VIII({ reportData }: { reportData: ReportData }) {
    if (!reportData) return null;

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

    const getRemark = (type: string, aspect?: string) => {
        return reportData.remarks?.find((r: any) =>
            r.type_name === type &&
            (aspect ? r.aspect === aspect : !r.aspect)
        )?.remark_text || '';
    };

    return (
        <div className="foundational-page content" style={{ fontFamily: "'Nunito', 'Segoe UI', Arial, sans-serif", fontSize: 13, color: C.text, background: '#dde8f5', padding: '24px 12px' }}>
            <div className="print-page" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>

                    {/* GENERAL INFORMATION */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading mt={0}>General Information</SectionHeading>
                        <div className="info-grid foundational-info-grid">
                            <div className="info-row">
                                <div className="info-label foundational-label">Student Name:</div>
                                <div className="info-input foundational-input">{reportData.student?.student_name}</div>
                            </div>
                            <div className="info-row-split">
                                <div className="info-row-half">
                                    <div className="info-label foundational-label">Roll No.:</div>
                                    <div className="info-input foundational-input">{reportData.student?.roll_no}</div>
                                </div>
                                <div className="info-row-compact">
                                    <div className="info-label foundational-label" style={{ marginLeft: 20 }}>Adm No.:</div>
                                    <div className="info-input foundational-input">{reportData.student?.admission_no}</div>
                                </div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Class / Section:</div>
                                <div className="info-input foundational-input">{reportData.student?.class_name} {reportData.student?.section_name ? '— ' + reportData.student?.section_name : ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Date of Birth:</div>
                                <div className="info-input foundational-input">{reportData.student?.dob ? new Date(reportData.student.dob).toLocaleDateString("en-GB") : ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Address:</div>
                                <div className="info-input foundational-input" style={{ minHeight: '40px' }}>{reportData.student?.address || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Phone:</div>
                                <div className="info-input foundational-input">{reportData.student?.phone_no || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Mother/Guardian Name:</div>
                                <div className="info-input foundational-input">{reportData.student?.mother_name || ''}</div>
                            </div>
                            <div className="info-row">
                                <div className="info-label foundational-label">Father/Guardian Name:</div>
                                <div className="info-input foundational-input">{reportData.student?.father_name || ''}</div>
                            </div>
                        </div>
                    </div>

                    {/* ATTENDANCE RECORD */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Attendance Record</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="attendance-table foundational-attendance">
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


                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>
                    {/* SCHOLASTIC DOMAINS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Scholastic Domains</SectionHeading>
                        <div style={{ overflowX: 'auto', borderRadius: '4px', border: `1px solid ${C.navy}` }}>
                            <table className="foundational-table scholastic-table">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ width: '15%' }}>Subjects</th>
                                        <th colSpan={2}>Periodic Assessment</th>
                                        <th colSpan={2}>Subject Enrichment Activities</th>
                                        <th colSpan={2}>Internal Assessment</th>
                                        <th colSpan={2}>Terminal Assessment</th>
                                        <th colSpan={2} className="gold-bg">Total</th>
                                        <th rowSpan={2}>Final Result<br />(Avg)</th>
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
                                        <th className="gold-bg">Term I</th>
                                        <th className="gold-bg">Term II</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let grandTotal1 = 0;
                                        let grandTotal2 = 0;
                                        let grandTotalAvg = 0;
                                        let subjectCount1 = 0;
                                        let subjectCount2 = 0;

                                        const rows = reportData.subjects?.map((sub: any) => {
                                            const subject = sub.subject_name;
                                            
                                            const getVal = (comp: string, term: string) => {
                                                const s = getScholasticScore(subject, comp, term);
                                                if (!s || !s.marks) return 0;
                                                const num = parseFloat(s.marks);
                                                return isNaN(num) ? 0 : num;
                                            };
                                            
                                            const hasMarks = (term: string) => {
                                                return getScholasticScore(subject, 'Periodic Assessment', term) || 
                                                       getScholasticScore(subject, 'Terminal Assessment', term);
                                            };

                                            const total1 = getVal('Periodic Assessment', 'Term I') + 
                                                           getVal('Subject Enrichment Activities', 'Term I') + 
                                                           getVal('Internal Assessment', 'Term I') + 
                                                           getVal('Terminal Assessment', 'Term I');
                                                           
                                            const total2 = getVal('Periodic Assessment', 'Term II') + 
                                                           getVal('Subject Enrichment Activities', 'Term II') + 
                                                           getVal('Internal Assessment', 'Term II') + 
                                                           getVal('Terminal Assessment', 'Term II');
                                            
                                            if (hasMarks('Term I')) {
                                                grandTotal1 += total1;
                                                subjectCount1++;
                                            }
                                            if (hasMarks('Term II')) {
                                                grandTotal2 += total2;
                                                subjectCount2++;
                                            }
                                            
                                            const avg = (total1 + total2) / 2;
                                            if (hasMarks('Term I') || hasMarks('Term II')) {
                                                grandTotalAvg += avg;
                                            }

                                            const displayTotal1 = hasMarks('Term I') ? parseFloat(total1.toFixed(2)) : '';
                                            const displayTotal2 = hasMarks('Term II') ? parseFloat(total2.toFixed(2)) : '';
                                            const displayAvg = (hasMarks('Term I') || hasMarks('Term II')) ? parseFloat(avg.toFixed(2)) : '';

                                            return (
                                                <tr key={subject}>
                                                    <td className="text-left" style={{ paddingLeft: '12px' }}>{subject}</td>
                                                    {renderScoreCell(subject, 'Periodic Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Periodic Assessment', 'Term II')}
                                                    {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term I')}
                                                    {renderScoreCell(subject, 'Subject Enrichment Activities', 'Term II')}
                                                    {renderScoreCell(subject, 'Internal Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Internal Assessment', 'Term II')}
                                                    {renderScoreCell(subject, 'Terminal Assessment', 'Term I')}
                                                    {renderScoreCell(subject, 'Terminal Assessment', 'Term II')}
                                                    <td style={{ fontWeight: 700 }}>{displayTotal1}</td>
                                                    <td style={{ fontWeight: 700 }}>{displayTotal2}</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{displayAvg}</td>
                                                </tr>
                                            );
                                        });
                                        
                                        const max1 = subjectCount1 * 100;
                                        const max2 = subjectCount2 * 100;
                                        const maxAvg = Math.max(subjectCount1, subjectCount2) * 100;

                                        const p1 = max1 > 0 ? ((grandTotal1 / max1) * 100).toFixed(2) : '';
                                        const p2 = max2 > 0 ? ((grandTotal2 / max2) * 100).toFixed(2) : '';
                                        const pAvg = maxAvg > 0 ? ((grandTotalAvg / maxAvg) * 100).toFixed(2) : '';

                                        return (
                                            <>
                                                {rows}
                                                <tr className="domain-header">
                                                    <td colSpan={11} style={{ textAlign: 'right', paddingRight: '15px' }}>Total Marks Obtained</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{maxAvg > 0 ? `${grandTotalAvg.toFixed(1)} / ${maxAvg}` : ''}</td>
                                                </tr>
                                                <tr className="domain-header" style={{ background: '#d1e0f7' }}>
                                                    <td colSpan={11} style={{ textAlign: 'right', paddingRight: '15px' }}>Overall Percentage</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{pAvg ? `${pAvg}%` : ''}</td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CO-SCHOLASTIC DOMAINS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Co-Scholastic Domains</SectionHeading>
                        <div style={{ borderRadius: '4px', border: `1px solid ${C.navy}`, overflow: 'hidden' }}>
                            <table className="foundational-table">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                        <th colSpan={2}>Grades</th>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '25%' }}>Term I</th>
                                        <th style={{ width: '25%' }}>Term II</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Physical Education */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Physical Education</td>
                                    </tr>
                                    {['Physical Fitness', 'Muscular Strength', 'Agility & Balance', 'Stamina'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Visual Art */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Visual Art</td>
                                    </tr>
                                    {['Creative Expression', 'Fine Motor Skills', 'Reflecting, Responding and Analyzing', 'Use of Technique'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>

                    {/* CO-SCHOLASTIC DOMAINS (Continued) */}
                    <div className="section" style={{ marginTop: 0 }}>
                        <div style={{ borderRadius: '4px', border: `1px solid ${C.navy}`, overflow: 'hidden', borderTop: 'none' }}>
                            <table className="foundational-table">
                                <tbody>
                                    <tr style={{ visibility: 'collapse' }}>
                                        <th style={{ width: '50%' }}></th>
                                        <th style={{ width: '25%' }}></th>
                                        <th style={{ width: '25%' }}></th>
                                    </tr>
                                    {/* Performing Art - Dance */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Performing Art - Dance</td>
                                    </tr>
                                    {['Posture', 'Expression', 'Rhythm', 'Overall Performance'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Performing Art - Music */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Performing Art - Music</td>
                                    </tr>
                                    {['Rhythm', 'Pitch', 'Melody (Sings in Tune)', 'Overall Performance'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PERSONALITY DEVELOPMENT SKILLS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Personality Development Skills</SectionHeading>
                        <div style={{ borderRadius: '4px', border: `1px solid ${C.navy}`, overflow: 'hidden' }}>
                            <table className="foundational-table">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ textAlign: 'left', width: '50%' }}>Sub-Skills</th>
                                        <th colSpan={2}>Grades</th>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '25%' }}>Term I</th>
                                        <th style={{ width: '25%' }}>Term II</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Social Skills */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Social Skills</td>
                                    </tr>
                                    {['Maintains cordial relationship with peers and adults', 'Demonstrates teamwork and cooperation', 'Respects school property and personal belongings'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Emotional Skills */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Emotional Skills</td>
                                    </tr>
                                    {['Shows sensitivity towards rules and norms', 'Demonstrates self-regulation of emotions and behaviour', 'Displays empathy and concern for others'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Work Habit */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Work Habit</td>
                                    </tr>
                                    {['Maintains regularity and punctuality', 'Demonstrates responsible citizenship', 'Shows care and concern for the environment'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}

                                    {/* Health & Wellness */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Health & Wellness</td>
                                    </tr>
                                    {['Follows good hygiene practices', 'Maintains cleanliness of self and surroundings', 'Demonstrates resilience and positive coping skills'].map(skill => (
                                        <tr key={skill}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>


                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>
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
                                        <div className="feedback-input">{getRemark("Parent’s Feedback", label)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Self Assessment */}
                            <div className="feedback-card">
                                <h3>Self-Assessment</h3>
                                {['Activities I enjoy the most', 'Activities I find challenging', 'Activities I enjoy doing with my friends'].map(label => (
                                    <div className="feedback-row" key={label}>
                                        <div className="feedback-label">{label}</div>
                                        <div className="feedback-input">{getRemark("Self-Assessment", label)}</div>
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
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 28px 28px' }}>
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
                                    <tr>
                                        <td style={{ fontWeight: 700, width: '50px' }}>A</td>
                                        <td style={{ textAlign: 'left' }}>Demonstrates clear understanding of the skill and applies it independently with confidence.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 700 }}>B</td>
                                        <td style={{ textAlign: 'left' }}>Demonstrates understanding of the skill but requires time and guidance for consistent performance.</td>
                                    </tr>
                                    <tr>
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
                                    <tr>
                                        <td style={{ fontWeight: 700, width: '50px' }}>A</td>
                                        <td style={{ textAlign: 'left' }}>Actively and effectively participates in activities involving agility, balance, coordination, speed and strength.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 700 }}>B</td>
                                        <td style={{ textAlign: 'left' }}>Participates adequately in physical activities with moderate proficiency.</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 700 }}>C</td>
                                        <td style={{ textAlign: 'left' }}>Requires support and encouragement to participate effectively in physical activities.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Local Styles for Matching Foundational */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        
        /* Foundational specifics overrides */
        .foundational-page {
            font-family: 'Nunito', 'Segoe UI', Arial, sans-serif !important;
        }
        .foundational-info-grid {
            border: 1px solid ${C.border} !important;
            border-radius: 6px !important;
            padding: 0 !important;
            background: transparent !important;
        }
        .foundational-info-grid .info-row,
        .foundational-info-grid .info-row-half,
        .foundational-info-grid .info-row-split {
            margin-bottom: 0 !important;
            gap: 0 !important;
        }
        .foundational-label {
            background: ${C.rowEven} !important;
            padding: 6px 4px !important;
            font-weight: 700 !important;
            font-size: 12.5px !important;
            color: ${C.navy} !important;
            border-bottom: 1px solid ${C.border} !important;
            border-right: 1px solid ${C.border} !important;
            display: flex;
            align-items: center;
        }
        .foundational-input {
            background: ${C.rowOdd} !important;
            padding: 6px 4px !important;
            font-size: 12.5px !important;
            color: ${C.text} !important;
            border: none !important;
            border-bottom: 1px solid ${C.border} !important;
            min-height: auto !important;
            border-radius: 0 !important;
        }
        .foundational-attendance th {
            background: ${C.navy} !important;
            color: ${C.white} !important;
            font-weight: 700 !important;
            padding: 6px 4px !important;
            text-align: center !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            font-size: 10.5px !important;
        }
        .foundational-attendance th:last-child {
            background: ${C.gold} !important;
        }
        .foundational-attendance td {
            padding: 8px 3px !important;
            border: 1px solid ${C.border} !important;
            color: ${C.text} !important;
            vertical-align: middle !important;
            font-size: 11px !important;
        }
        .foundational-attendance td:first-child,
        .foundational-attendance td:last-child {
            background: ${C.rowEven} !important;
        }
        .foundational-table {
            width: 100%;
            border-collapse: collapse;
        }
        .foundational-table th {
            background: ${C.navy} !important;
            color: ${C.white} !important;
            font-weight: 700 !important;
            padding: 6px 4px !important;
            text-align: center !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            font-size: 10.5px !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .foundational-table th.gold-bg {
            background: ${C.gold} !important;
        }
        .foundational-table td {
            padding: 6px 10px !important;
            border: 1px solid ${C.border} !important;
            color: ${C.text} !important;
            vertical-align: middle !important;
            font-size: 11px !important;
            text-align: center;
        }
        .foundational-table td.text-left {
            text-align: left !important;
        }
        .foundational-table tr.domain-header td {
            background: ${C.subheadBg} !important;
            color: ${C.navyMid} !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 12px !important;
            padding: 6px 14px !important;
            border: none !important;
        }
        .foundational-table tr td:first-child {
            font-weight: 600;
            color: ${C.navyMid};
        }

        /* Print formatting to prevent huge empty spaces */
        @media print {
            .page-break {
                page-break-before: always;
                break-before: page;
            }
            .foundational-page, .print-page { 
                background: white !important; 
                padding: 0 !important; 
                margin: 0 !important; 
                box-shadow: none !important; 
                border-radius: 0 !important;
                width: 100% !important; 
                min-height: auto !important;
                display: block !important;
                overflow: visible !important;
            }
            /* Override any inline overflow: hidden or auto that prevents page breaks */
            .section > div {
                overflow: visible !important;
                overflow-x: visible !important;
            }
            .section, .foundational-page div {
                break-inside: auto !important;
                page-break-inside: auto !important;
            }
            table.foundational-table, table.attendance-table, table.compact-table {
                break-inside: auto !important;
                page-break-inside: auto !important;
            }
            table.foundational-table tr, table.attendance-table tr, table.compact-table tr, .domain-header {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            .signature-section, .grading-section, .feedback-card, .feedback-row, .info-row, .info-row-split {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            h2, h3, .section-title {
                break-after: avoid !important;
                page-break-after: avoid !important;
            }
            thead {
                display: table-header-group !important;
            }
            tfoot {
                display: table-footer-group !important;
            }
        }

        .scholastic-table th, .scholastic-table td {
            padding-left: 2px !important;
            padding-right: 2px !important;
        }
        `}</style>
        </div>
    );
}
