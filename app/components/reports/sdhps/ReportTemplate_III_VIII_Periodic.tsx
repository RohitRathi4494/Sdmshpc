import React from 'react';

interface ReportData {
    student: any;
    scholastic: any[];
    attendance: any[];
    subjects?: any[];
    components?: any[];
}

// ── style tokens matching the Foundational Stage HTML reference ──
const C = {
    navy: '#369e87', navyMid: '#2c826f', gold: '#C8922A', goldLight: '#f0c060',
    paleBg: '#f6fbf9', rowOdd: '#FFFFFF', rowEven: '#edf7f5', border: '#b3dcd3',
    subheadBg: '#d9f0ea', tagA: '#1a7a3b', tagB: '#2563EB', tagC: '#d97706',
    text: '#1a2840', muted: '#4B5563', white: '#FFFFFF',
};

// ── Section Heading Component ──
function SectionHeading({ children, mt }: { children: React.ReactNode; mt?: number }) {
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
function SchoolHeader({ title }: { title: string }) {
    return (
        <div style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <div style={{ background: C.navy, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px' }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', border: `2px solid ${C.goldLight}`,
                    background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden'
                }}>
                    <img src="/sdhps_logo.png" alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: C.white, letterSpacing: 0.4 }}>
                        S D HERITAGE PRIDE SCHOOL, GURUGRAM
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

export default function ReportTemplate_III_VIII_Periodic_SDHPS({ reportData, reportType }: { reportData: ReportData, reportType: 'PA1' | 'PA2' }) {
    if (!reportData) return null;

    const termName = reportType === 'PA1' ? 'Term I' : 'Term II';
    const reportTitle = reportType === 'PA1' ? 'Periodic Assessment 1' : 'Periodic Assessment 2';

    // --- Helpers ---
    const getScholasticScore = (subjectName: string, componentName: string, termName: string) => {
        return reportData.scholastic?.find((s: any) =>
            s.subject_name === subjectName &&
            s.component_name === componentName &&
            s.term_name === termName
        );
    };

    const months = reportType === 'PA1'
        ? ['Apr', 'May', 'Jul', 'Aug', 'Sep']
        : ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    const getAttendance = (month: string) => reportData.attendance?.find((a: any) => a.month_name?.startsWith(month));

    return (
        <div className="foundational-page content" style={{ fontFamily: "'Nunito', 'Segoe UI', Arial, sans-serif", fontSize: 13, color: C.text, background: C.white, padding: '0' }}>
            <div className="print-page page-break" style={{
                width: '100%', maxWidth: '210mm', margin: '0 auto', background: C.white,
                borderRadius: 4, overflow: 'hidden',
                boxSizing: 'border-box', position: 'relative'
            }}>
                <SchoolHeader title={reportTitle} />
                <div style={{ padding: '12px' }}>

                    {/* GENERAL INFORMATION */}
                    <div className="section" style={{ marginTop: 8 }}>
                        <SectionHeading mt={0}>General Information</SectionHeading>
                        <table className="foundational-table" style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${C.navy}`, fontSize: 13, background: C.white }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '22%', background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Student Name:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.student_name}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Roll No.:</td>
                                    <td style={{ width: '28%', padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.roll_no}</td>
                                    <td style={{ width: '15%', background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Adm No.:</td>
                                    <td style={{ width: '35%', padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.admission_no}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Class / Section:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.class_name} {reportData.student?.section_name ? '— ' + reportData.student?.section_name : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Date of Birth:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.dob ? new Date(reportData.student.dob).toLocaleDateString("en-GB") : ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Address:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.address || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Phone:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.phone_no || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Mother/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.mother_name || ''}</td>
                                </tr>
                                <tr>
                                    <td style={{ background: C.rowEven, padding: '4px 8px', fontWeight: 700, color: C.navy, textAlign: 'left' }}>Father/Guardian Name:</td>
                                    <td colSpan={3} style={{ padding: '4px 8px', color: C.text, textAlign: 'left' }}>{reportData.student?.father_name || ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>




                    {/* SCHOLASTIC RECORD */}
                    <div className="section" style={{ marginTop: 12 }}>
                        <SectionHeading>Scholastic Performance</SectionHeading>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="foundational-table scholastic-table" style={{ width: '100%', border: `1px solid ${C.navy}` }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%', textAlign: 'left', paddingLeft: 12 }}>Subjects</th>
                                        <th style={{ width: '30%' }}>Max Marks</th>
                                        <th style={{ width: '30%' }}>Marks Obtained</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let totalMarksObj = 0;
                                        let totalMax = 0;

                                        const getComponentMax = (subInfo: any, componentName: string) => {
                                            const comp = reportData.components?.find((c: any) => c.component_name === componentName);
                                            if (!comp) return 0;
                                            const cid = comp.id.toString();
                                            if (subInfo.assessment_max_marks && subInfo.assessment_max_marks[cid] !== undefined) {
                                                return Number(subInfo.assessment_max_marks[cid]);
                                            }
                                            return comp.max_marks || 0;
                                        };

                                        const rows = reportData.subjects?.map((sub: any) => {
                                            const subject = sub.subject_name;
                                            const maxPA = getComponentMax(sub, 'Periodic Assessment');

                                            const scoreObj = getScholasticScore(subject, 'Periodic Assessment', termName);
                                            const marks = scoreObj?.marks ?? '-';

                                            totalMax += maxPA;
                                            if (marks !== '-' && !isNaN(Number(marks))) {
                                                totalMarksObj += Number(marks);
                                            }

                                            return (
                                                <tr key={subject}>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12, fontWeight: 600 }}>{subject}</td>
                                                    <td style={{ textAlign: 'center' }}>{maxPA}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{marks}</td>
                                                </tr>
                                            );
                                        });

                                        const percentage = totalMax > 0 ? ((totalMarksObj / totalMax) * 100).toFixed(2) : '-';

                                        return (
                                            <>
                                                {rows}
                                                <tr>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12, fontWeight: 700 }}>Total</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalMax}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalMarksObj}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ textAlign: 'left', paddingLeft: 12, fontWeight: 700 }}>Percentage</td>
                                                    <td colSpan={2} style={{ textAlign: 'center', fontWeight: 700 }}>{percentage}%</td>
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
