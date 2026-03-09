import React from 'react';

interface ReportData {
    student: any;
    scholastic: any[];
    co_scholastic: any[];
    attendance: any[];
    remarks: any[];
    subjects?: any[];
    components?: any[];
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

function GoldBar() {
    return <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }} />;
}

export default function ReportTemplate_XI({ reportData }: { reportData: ReportData }) {
    if (!reportData) return null;

    // --- Helpers ---
    const getScholasticScore = (subjectName: string, componentName: string, termName: string) => {
        return reportData.scholastic?.find((s: any) =>
            s.subject_name === subjectName &&
            s.component_name === componentName &&
            s.term_name === termName
        );
    };

    const getComponentMax = (subInfo: any, componentName: string) => {
        const comp = reportData.components?.find((c: any) => c.component_name === componentName);
        if (!comp) return 0;
        const cid = comp.id.toString();
        if (subInfo.assessment_max_marks && subInfo.assessment_max_marks[cid] !== undefined) {
            return Number(subInfo.assessment_max_marks[cid]);
        }
        return comp.max_marks || 0;
    };

    const renderScoreCell = (subInfo: any, component: string, term: string) => {
        const subject = subInfo.subject_name;
        const maxMarks = getComponentMax(subInfo, component);
        if (maxMarks === 0) {
            return <td className="input-cell" key={`${subject}-${component}-${term}`}>NA</td>;
        }
        const score = getScholasticScore(subject, component, term);
        return <td className="input-cell" key={`${subject}-${component}-${term}`}>{score?.marks ?? ''}</td>;
    };

    const months = ['Apr', 'May', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
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
                width: '100%', maxWidth: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader />
                <div style={{ padding: '22px 14px 28px' }}>

                    {/* GENERAL INFORMATION */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading mt={0}>General Information</SectionHeading>
                        <table className="foundational-table gen-info-table" style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.navy}`, background: C.white }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '22%', background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Student Name:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.student_name}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Roll No.:</td>
                                    <td style={{ width: '28%', padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.roll_no}</td>
                                    <td style={{ width: '15%', background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Adm No.:</td>
                                    <td style={{ width: '35%', padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.admission_no}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Class / Section:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.class_name} {reportData.student?.section_name ? '— ' + reportData.student?.section_name : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Date of Birth:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.dob ? new Date(reportData.student.dob).toLocaleDateString("en-GB") : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Address:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.address || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Phone:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.phone_no || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Mother/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.mother_name || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '26px 12px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Father/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '26px 12px', color: C.text, textAlign: 'left' }}>{reportData.student?.father_name || ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* SCHOLASTIC DOMAINS — XI/XII Structure: PA + TA + Lab (no SEA, no IA) */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Scholastic Domains</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="foundational-table scholastic-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '20%' }} />{/* Subjects */}
                                    <col style={{ width: '7%' }} />{/* PA T1 */}
                                    <col style={{ width: '7%' }} />{/* PA T2 */}
                                    <col style={{ width: '9%' }} />{/* Theory T1 */}
                                    <col style={{ width: '9%' }} />{/* Practical T1 */}
                                    <col style={{ width: '9%' }} />{/* Theory T2 */}
                                    <col style={{ width: '9%' }} />{/* Practical T2 */}
                                    <col style={{ width: '8%' }} />{/* Total T1 */}
                                    <col style={{ width: '8%' }} />{/* Total T2 */}
                                    <col style={{ width: '14%' }} />{/* Final Result */}
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th rowSpan={3} style={{ width: '18%' }}>Subjects</th>
                                        <th colSpan={2}>Periodic Assessment<br /><span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(20 Marks)</span></th>
                                        <th colSpan={4}>Terminal Assessment<br /><span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>(80 Marks)</span></th>
                                        <th colSpan={2} className="gold-bg">Total</th>
                                        <th rowSpan={3} className="gold-bg">Final Result<br />(Avg)</th>
                                    </tr>
                                    <tr>
                                        <th rowSpan={2}>Term I</th>
                                        <th rowSpan={2}>Term II</th>
                                        <th colSpan={2}>Term 1</th>
                                        <th colSpan={2}>Term 2</th>
                                        <th rowSpan={2} className="gold-bg">Term I</th>
                                        <th rowSpan={2} className="gold-bg">Term II</th>
                                    </tr>
                                    <tr>
                                        <th>Theory</th>
                                        <th>Practical</th>
                                        <th>Theory</th>
                                        <th>Practical</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let grandTotal1 = 0;
                                        let grandTotal2 = 0;
                                        let grandTotalAvg = 0;
                                        let maxTotal1 = 0;
                                        let maxTotal2 = 0;
                                        let maxTotalAvg = 0;

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

                                            const labMax1 = getComponentMax(sub, 'Lab Assessment');
                                            const total1 = getVal('Periodic Assessment', 'Term I') +
                                                getVal('Terminal Assessment', 'Term I') +
                                                getVal('Lab Assessment', 'Term I');

                                            const total2 = getVal('Periodic Assessment', 'Term II') +
                                                getVal('Terminal Assessment', 'Term II') +
                                                getVal('Lab Assessment', 'Term II');

                                            const subMaxTotal = getComponentMax(sub, 'Periodic Assessment') +
                                                getComponentMax(sub, 'Terminal Assessment') +
                                                getComponentMax(sub, 'Lab Assessment');

                                            if (hasMarks('Term I')) {
                                                grandTotal1 += total1;
                                                maxTotal1 += subMaxTotal;
                                            }
                                            if (hasMarks('Term II')) {
                                                grandTotal2 += total2;
                                                maxTotal2 += subMaxTotal;
                                            }

                                            const avg = (total1 + total2) / 2;
                                            if (hasMarks('Term I') || hasMarks('Term II')) {
                                                grandTotalAvg += avg;
                                                maxTotalAvg += subMaxTotal;
                                            }

                                            const displayTotal1 = hasMarks('Term I') ? parseFloat(total1.toFixed(2)) : '';
                                            const displayTotal2 = hasMarks('Term II') ? parseFloat(total2.toFixed(2)) : '';
                                            let displayAvg: string | number = '';
                                            if (hasMarks('Term I') || hasMarks('Term II')) {
                                                displayAvg = `${parseFloat(avg.toFixed(2))}/${subMaxTotal}`;
                                            }

                                            // Lab Assessment — show NA if no lab for this subject
                                            const labMax = getComponentMax(sub, 'Lab Assessment');

                                            return (
                                                <tr key={subject}>
                                                    <td className="text-left" style={{ paddingLeft: '12px' }}>{subject}</td>
                                                    {renderScoreCell(sub, 'Periodic Assessment', 'Term I')}
                                                    {renderScoreCell(sub, 'Periodic Assessment', 'Term II')}
                                                    {renderScoreCell(sub, 'Terminal Assessment', 'Term I')}
                                                    {labMax > 0 ? renderScoreCell(sub, 'Lab Assessment', 'Term I') : <td className="input-cell">NA</td>}
                                                    {renderScoreCell(sub, 'Terminal Assessment', 'Term II')}
                                                    {labMax > 0 ? renderScoreCell(sub, 'Lab Assessment', 'Term II') : <td className="input-cell">NA</td>}
                                                    <td style={{ fontWeight: 700 }}>{displayTotal1}</td>
                                                    <td style={{ fontWeight: 700 }}>{displayTotal2}</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{displayAvg}</td>
                                                </tr>
                                            );
                                        });

                                        const p1 = maxTotal1 > 0 ? ((grandTotal1 / maxTotal1) * 100).toFixed(2) : '';
                                        const p2 = maxTotal2 > 0 ? ((grandTotal2 / maxTotal2) * 100).toFixed(2) : '';
                                        const pAvg = maxTotalAvg > 0 ? ((grandTotalAvg / maxTotalAvg) * 100).toFixed(2) : '';

                                        return (
                                            <>
                                                {rows}
                                                <tr className="domain-header">
                                                    <td colSpan={10} style={{ textAlign: 'right', paddingRight: '15px' }}>Total Marks Obtained</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{maxTotalAvg > 0 ? `${grandTotalAvg.toFixed(1)} / ${maxTotalAvg}` : ''}</td>
                                                </tr>
                                                <tr className="domain-header" style={{ background: '#d1e0f7' }}>
                                                    <td colSpan={10} style={{ textAlign: 'right', paddingRight: '15px' }}>Overall Percentage</td>
                                                    <td style={{ fontWeight: 800, color: C.navy }}>{pAvg ? `${pAvg}%` : ''}</td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '100%', maxWidth: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <GoldBar />
                <div style={{ padding: '22px 14px 28px' }}>
                    {/* CO-SCHOLASTIC DOMAINS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Co-Scholastic Domains</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
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
                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Communication */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Communication</td>
                                    </tr>
                                    {['Articulation & Clarity in Expression', 'Active Listening & Understanding', 'Confidence in Public Speaking', 'Vocabulary Usage & Language Fluency'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getCoScholastic(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getCoScholastic(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Visual Art */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Visual Art</td>
                                    </tr>
                                    {['Creative Expression', 'Fine Motor Skills', 'Reflecting, Responding and Analyzing', 'Use of Technique'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
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
                        <div style={{ overflowX: 'auto' }}>
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
                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Social Skills */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Social Skills</td>
                                    </tr>
                                    {['Maintains cordial relationship with peers and adults', 'Demonstrates teamwork and cooperation', 'Respects school property and personal belongings'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Emotional Skills */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Emotional Skills</td>
                                    </tr>
                                    {['Shows sensitivity towards rules and norms', 'Demonstrates self-regulation of emotions and behaviour', 'Displays empathy and concern for others'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
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
                width: '100%', maxWidth: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <GoldBar />
                <div style={{ padding: '22px 14px 28px' }}>
                    {/* PERSONALITY DEVELOPMENT SKILLS */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Personality Development Skills (Continued)</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
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

                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Work Habit */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Work Habit</td>
                                    </tr>
                                    {['Maintains regularity and punctuality', 'Demonstrates responsible citizenship', 'Shows care and concern for the environment'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tbody style={{ pageBreakInside: 'avoid' }}>
                                    {/* Health & Wellness */}
                                    <tr className="domain-header">
                                        <td colSpan={3} className="text-left" style={{ textAlign: 'center' }}>Health & Wellness</td>
                                    </tr>
                                    {['Follows good hygiene practices', 'Maintains cleanliness of self and surroundings', 'Demonstrates resilience and positive coping skills'].map(skill => (
                                        <tr key={skill} style={{ height: 32 }}>
                                            <td className="text-left" style={{ paddingLeft: '15px' }}>{skill}</td>
                                            <td>{getPersonality(skill, 'Term I')?.grade || ''}</td>
                                            <td>{getPersonality(skill, 'Term II')?.grade || ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* FEEDBACK SECTIONS */}
                    <div className="section">
                        <div className="feedback-grid">
                            <div className="feedback-card">
                                <h3>Learner's Profile by the Teacher</h3>
                                <div className="feedback-input" style={{ minHeight: '80px' }}>
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

                            <div className="feedback-card">
                                <h3>Student Feedback (Self-Assessment)</h3>
                                {['Activities I enjoy the most', 'Activities I find challenging', 'Activities I enjoy doing with my friends'].map(label => (
                                    <div className="feedback-row" key={label}>
                                        <div className="feedback-label">{label}</div>
                                        <div className="feedback-input">{getRemark("Self-Assessment", label)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---> PAGE BREAK <--- */}
            <div className="print-page page-break" style={{
                width: '100%', maxWidth: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
                borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <GoldBar />
                <div style={{ padding: '22px 14px 28px' }}>


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
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>No. of Working Days</td>
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
                                        <td colSpan={12} className="input-cell text-left" style={{ paddingLeft: '12px' }}>
                                            {reportData.attendance?.[0]?.reason_for_low_attendance || ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* SIGNATURE SECTION */}
                    <div className="section" style={{ marginTop: 16 }}>
                        <SectionHeading>Signature With Date</SectionHeading>
                        <div style={{ marginTop: 8 }}>
                            <table className="foundational-table" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: '100%', fontSize: '11.5px', border: `1px solid ${C.navy}` }}>
                                <thead>
                                    <tr>
                                        {['Parent / Guardian', 'Class Teacher', 'Block Incharge', 'Principal'].map((h) => (
                                            <th key={h} style={{ width: '25%', textTransform: 'uppercase', padding: '10px 14px', background: C.navy, color: C.white, textAlign: 'center', fontWeight: 600, border: `1px solid ${C.navy}` }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: C.white }}>
                                        {[0, 1, 2, 3].map(i => <td key={i} style={{ padding: '0 !important', height: '60px', border: `1px solid ${C.navy}` }} />)}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
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
                        <h2 className="section-title">Evaluation Levels: Communication</h2>
                        <table className="compact-table">
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: 700, width: '50px' }}>A</td>
                                    <td style={{ textAlign: 'left' }}>Communicates ideas clearly and confidently, with excellent vocabulary and active listening skills.</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 700 }}>B</td>
                                    <td style={{ textAlign: 'left' }}>Communicates effectively in most situations but requires some encouragement for public speaking.</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 700 }}>C</td>
                                    <td style={{ textAlign: 'left' }}>Requires support and practice to articulate thoughts clearly and engage in active listening.</td>
                                </tr>
                            </tbody>
                        </table>
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
            padding: 12px 6px !important;
            font-weight: 700 !important;
            font-size: 14px !important;
            color: ${C.navy} !important;
            border-bottom: 1px solid ${C.border} !important;
            border-right: 1px solid ${C.border} !important;
            display: flex;
            align-items: center;
        }
        .foundational-input {
            background: ${C.rowOdd} !important;
            padding: 12px 6px !important;
            font-size: 14px !important;
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
            padding: 6px 4px !important;
            border: 1px solid ${C.navy} !important;
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
            border: 1px solid ${C.navy} !important;
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
            border: 1px solid ${C.navy} !important;
            color: ${C.text} !important;
            vertical-align: middle !important;
            font-size: 11px !important;
            text-align: center;
        }
        .foundational-table td.text-left {
            text-align: left !important;
        }
        .foundational-table.gen-info-table td {
            padding: 14px 12px !important;
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
            @page { size: A4 portrait; margin: 0; }
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
            }
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
                max-width: 100% !important;
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
            padding-top: 10px !important;
            padding-bottom: 10px !important;
        }
        `}</style>
        </div >
    );
}
