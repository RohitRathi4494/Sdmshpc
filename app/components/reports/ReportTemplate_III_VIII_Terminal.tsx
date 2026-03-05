import React from 'react';

interface ReportData {
    student: any;
    scholastic: any[];
    attendance: any[];
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
function SectionHeading({ children, mt }: { children: React.ReactNode; mt?: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: `${mt ?? 8}px 0 4px` }}>
            <div style={{ width: 4, height: 18, background: C.gold, borderRadius: 3, flexShrink: 0 }} />
            <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {children}
            </h3>
        </div>
    );
}

// ── School Header Component ──
function SchoolHeader({ title }: { title: string }) {
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
                        {title}
                    </div>
                </div>
            </div>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }} />
        </div>
    );
}

export default function ReportTemplate_III_VIII_Terminal({ reportData, reportType }: { reportData: ReportData, reportType: 'TA1' | 'TA2' }) {
    if (!reportData) return null;

    const termName = reportType === 'TA1' ? 'Term I' : 'Term II';
    const reportTitle = reportType === 'TA1' ? 'Terminal Assessment 1' : 'Terminal Assessment 2';

    // --- Helpers ---
    const getScholasticScore = (subjectName: string, componentName: string, termName: string) => {
        return reportData.scholastic?.find((s: any) =>
            s.subject_name === subjectName &&
            s.component_name === componentName &&
            s.term_name === termName
        );
    };

    const months = reportType === 'TA1'
        ? ['Apr', 'May', 'Jul', 'Aug', 'Sep']
        : ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    const getAttendance = (month: string) => reportData.attendance?.find((a: any) => a.month_name?.startsWith(month));

    return (
        <div className="foundational-page content" style={{ fontFamily: "'Nunito', 'Segoe UI', Arial, sans-serif", fontSize: 12, color: C.text, background: C.white, padding: '0' }}>
            <div className="print-page page-break" style={{
                width: '100%', maxWidth: '210mm', margin: '0 auto', background: C.white,
                borderRadius: 4, overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader title={reportTitle} />
                <div style={{ padding: '8px 12px' }}>

                    {/* GENERAL INFORMATION */}
                    <div className="section" style={{ marginTop: 4 }}>
                        <SectionHeading mt={0}>General Information</SectionHeading>
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.navy}`, fontSize: 12, background: C.white }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '22%', background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Student Name:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.student_name}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Roll No.:</td>
                                    <td style={{ width: '28%', padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.roll_no}</td>
                                    <td style={{ width: '15%', background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Adm No.:</td>
                                    <td style={{ width: '35%', padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.admission_no}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Class / Section:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.class_name} {reportData.student?.section_name ? '— ' + reportData.student?.section_name : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Date of Birth:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.dob ? new Date(reportData.student.dob).toLocaleDateString("en-GB") : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Address:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.address || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Phone:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.phone_no || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.navy}`, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Mother/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, borderBottom: `1px solid ${C.navy}`, textAlign: 'left' }}>{reportData.student?.mother_name || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '3px 6px', fontWeight: 700, color: C.navy, borderRight: `1px solid ${C.navy}`, textAlign: 'left' }}>Father/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '3px 6px', color: C.text, textAlign: 'left' }}>{reportData.student?.father_name || ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ATTENDANCE RECORD */}
                    <div className="section" style={{ marginTop: 8 }}>
                        <SectionHeading mt={4}>Attendance Record ({termName})</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="attendance-table foundational-attendance" style={{ border: `1px solid ${C.navy}` }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '20%' }}>Months</th>
                                        {months.map(m => <th key={m}>{m}</th>)}
                                        <th style={{ width: '12%' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px', borderRight: `1px solid ${C.navy}` }}>No. of Working days</td>
                                        {months.map(m => <td key={m} className="input-cell" style={{ padding: '2px 4px', borderRight: `1px solid ${C.navy}`, borderBottom: `1px solid ${C.navy}` }}>{getAttendance(m)?.working_days || ''}</td>)}
                                        <td className="input-cell" style={{ padding: '2px 4px', borderBottom: `1px solid ${C.navy}` }}>
                                            {months.reduce((acc: number, m: string) => acc + (getAttendance(m)?.working_days || 0), 0) || 0}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px', borderRight: `1px solid ${C.navy}` }}>No. of Days Present</td>
                                        {months.map(m => <td key={m} className="input-cell" style={{ padding: '2px 4px', borderRight: `1px solid ${C.navy}`, borderBottom: `1px solid ${C.navy}` }}>{getAttendance(m)?.days_present || ''}</td>)}
                                        <td className="input-cell" style={{ padding: '2px 4px', borderBottom: `1px solid ${C.navy}` }}>
                                            {months.reduce((acc: number, m: string) => acc + (getAttendance(m)?.days_present || 0), 0) || 0}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px', borderRight: `1px solid ${C.navy}` }}>% of attendance</td>
                                        {months.map(m => {
                                            const att = getAttendance(m);
                                            return <td key={m} className="input-cell" style={{ padding: '2px 4px', borderRight: `1px solid ${C.navy}`, borderBottom: `1px solid ${C.navy}` }}>{att && att.working_days ? Math.round((att.days_present / att.working_days) * 100) : ''}</td>;
                                        })}
                                        <td className="input-cell" style={{ padding: '2px 4px', borderBottom: `1px solid ${C.navy}` }}>
                                            {(() => {
                                                const totalW = months.reduce((acc: number, m: string) => acc + (getAttendance(m)?.working_days || 0), 0) || 0;
                                                const totalP = months.reduce((acc: number, m: string) => acc + (getAttendance(m)?.days_present || 0), 0) || 0;
                                                return totalW ? Math.round((totalP / totalW) * 100) + '%' : '';
                                            })()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px', borderRight: `1px solid ${C.navy}` }}>If attendance is low then reason</td>
                                        <td colSpan={months.length + 1} className="input-cell text-left" style={{ paddingLeft: '12px' }}>
                                            {reportData.attendance?.find(a => months.some(m => a.month_name?.startsWith(m)) && a.reason_for_low_attendance)?.reason_for_low_attendance || ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SCHOLASTIC RECORD */}
                    <div className="section" style={{ marginTop: 8 }}>
                        <SectionHeading mt={4}>Scholastic Performance ({termName})</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="foundational-table scholastic-table" style={{ width: '100%', border: `1px solid ${C.navy}` }}>
                                <thead>
                                    <tr>
                                        <th rowSpan={2} style={{ width: '25%', textAlign: 'left', paddingLeft: 12 }}>Subjects</th>
                                        <th>Periodic Assessment</th>
                                        <th>Sub. Enrichment</th>
                                        <th>Internal Assessment</th>
                                        <th>Terminal Assessment</th>
                                        <th className="gold-bg">Total</th>
                                    </tr>
                                    <tr>
                                        <th style={{ fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', padding: '2px' }}>Max: 30</th>
                                        <th style={{ fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', padding: '2px' }}>Max: 5</th>
                                        <th style={{ fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', padding: '2px' }}>Max: 5</th>
                                        <th style={{ fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', padding: '2px' }}>Max: 60</th>
                                        <th className="gold-bg" style={{ fontSize: 11, fontWeight: 'normal', fontStyle: 'italic', padding: '2px' }}>Max: 100</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let totalMarksObj = 0;

                                        const rows = reportData.subjects?.map((sub: any) => {
                                            const subject = sub.subject_name;

                                            const paScore = getScholasticScore(subject, 'Periodic Assessment', termName)?.marks || 0;
                                            const seaScore = getScholasticScore(subject, 'Subject Enrichment Activities', termName)?.marks || 0;
                                            const iaScore = getScholasticScore(subject, 'Internal Assessment', termName)?.marks || 0;
                                            const taScore = getScholasticScore(subject, 'Terminal Assessment', termName)?.marks || 0;

                                            const paVal = paScore || '-';
                                            const seaVal = seaScore || '-';
                                            const iaVal = iaScore || '-';
                                            const taVal = taScore || '-';

                                            let totalVal: number | string = '-';

                                            if (paScore || seaScore || iaScore || taScore) {
                                                const numericTotal = Number(paScore || 0) + Number(seaScore || 0) + Number(iaScore || 0) + Number(taScore || 0);
                                                totalVal = numericTotal;
                                                totalMarksObj += numericTotal;
                                            }

                                            return (
                                                <tr key={subject}>
                                                    <td style={{ textAlign: 'left', paddingLeft: 8, fontWeight: 600, borderRight: `1px solid ${C.navy}` }}>{subject}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px' }}>{paVal}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px' }}>{seaVal}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px' }}>{iaVal}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px' }}>{taVal}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px', fontWeight: 'bold' }}>{totalVal}</td>
                                                </tr>
                                            );
                                        });

                                        const totalMax = (reportData.subjects?.length || 0) * 100;
                                        const percentage = totalMax > 0 ? ((totalMarksObj / totalMax) * 100).toFixed(2) : '-';

                                        return (
                                            <>
                                                {rows}
                                                <tr>
                                                    <td style={{ textAlign: 'left', paddingLeft: 8, fontWeight: 700, borderRight: `1px solid ${C.navy}` }}>Total</td>
                                                    <td colSpan={4} style={{ textAlign: 'center', fontWeight: 700, padding: '2px 4px', borderRight: `1px solid ${C.navy}` }}>{totalMax}</td>
                                                    <td className="input-cell" style={{ padding: '2px 4px', fontWeight: 700 }}>{totalMarksObj}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ textAlign: 'left', paddingLeft: 8, fontWeight: 700, borderRight: `1px solid ${C.navy}` }}>Percentage</td>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2px 4px', fontWeight: 700 }}>{percentage}%</td>
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
        </div>
    );
}
