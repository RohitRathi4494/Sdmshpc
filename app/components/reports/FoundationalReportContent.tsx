'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FOUNDATIONAL_DOMAINS, SELF_ASSESS_FIELDS, PARENT_FEEDBACK_FIELDS,
    FAVOURITE_THINGS_FIELDS, RATINGS, isSubSection,
} from '@/app/lib/foundational-skills';
import { PRINT_STYLES } from '@/app/lib/print-styles';

// ── style tokens matching the HTML reference ──────────────────────────────────
const C = {
    navy: '#1B3D6F', navyMid: '#244d8a', gold: '#C8922A', goldLight: '#f0c060',
    paleBg: '#F5F8FF', rowOdd: '#FFFFFF', rowEven: '#EFF4FB', border: '#c9d8ee',
    subheadBg: '#dbe8fa', tagA: '#1a7a3b', tagB: '#2563EB', tagC: '#d97706',
    text: '#1a2840', muted: '#4B5563', white: '#FFFFFF',
};

const ratingColor = (r: string) =>
    r === 'A' ? C.tagA : r === 'B' ? C.tagB : r === 'C' ? C.tagC : '#aaa';

type RatingMap = Record<string, string>;  // "term:domain:skillKey" → "A"|"B"|"C"
type TextMap = Record<string, string>;  // "term:fieldKey" → value

// ── Inline SVGs to guarantee PDF rendering regardless of font cache ─────────────
const StarSVG = ({ color }: { color: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 1px', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const CakeSVG = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path>
        <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2 1 2 1"></path>
        <path d="M2 21h20"></path>
        <path d="M7 8v2"></path>
        <path d="M12 8v2"></path>
        <path d="M17 8v2"></path>
        <path d="M7 4h.01"></path>
        <path d="M12 4h.01"></path>
        <path d="M17 4h.01"></path>
    </svg>
);

const DotSVG = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.gold} xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <circle cx="12" cy="12" r="6" />
    </svg>
);

// ── Helper: render a star rating badge ───────────────────────────────────────
function Badge({ rating }: { rating: string }) {
    if (!rating) return <span style={{ color: '#bbb' }}>—</span>;
    const r = RATINGS.find(x => x.value === rating);
    const starCount = r?.stars?.length || 0;
    const color = ratingColor(rating);

    if (starCount > 0) {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {Array.from({ length: starCount }).map((_, i) => <StarSVG key={i} color={color} />)}
            </span>
        );
    }
    return (
        <span style={{ color: color, fontWeight: 800, fontSize: 16 }}>
            {r?.stars ?? rating}
        </span>
    );
}

// ── Shared table styles ───────────────────────────────────────────────────────
const FONT_STACK = "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Arial Unicode MS', 'Nunito', 'Segoe UI', Arial, sans-serif";

const obsThStyle: React.CSSProperties = {
    background: C.navy, color: C.white, fontWeight: 700, fontFamily: FONT_STACK,
    padding: '9px 14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)',
};
const obsTdStyle: React.CSSProperties = {
    padding: '8px 14px', border: `1px solid ${C.border}`, fontFamily: FONT_STACK,
    color: C.text, verticalAlign: 'middle', fontSize: 12,
};
const subheadTd: React.CSSProperties = {
    background: C.subheadBg, color: C.navy, fontWeight: 700, fontFamily: FONT_STACK,
    fontSize: 12, padding: '7px 14px', border: `1px solid ${C.border}`,
};

// ── Section Heading ───────────────────────────────────────────────────────────
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

// ── School Header ─────────────────────────────────────────────────────────────
function SchoolHeader() {
    return (
        <>
            <div style={{ background: C.navy, display: 'flex', alignItems: 'center', gap: 16, padding: '10px 24px' }}>
                <div style={{
                    width: 50, height: 50, borderRadius: '50%', border: `2px solid ${C.goldLight}`,
                    background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden'
                }}>
                    <img src="/school_logo.png" alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.white, letterSpacing: 0.4 }}>
                        S D MEMORIAL SR. SEC. SCHOOL, GURUGRAM
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.goldLight, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>
                        Holistic Progress Card — Foundational Stage
                    </div>
                </div>
            </div>
            <GoldBar />
        </>
    );
}

function GoldBar() {
    return <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, ${C.gold})` }} />;
}

// ── Domain table (used for Pages 2–4) ────────────────────────────────────────
function DomainTable({ domainKey, ratings, rowHeight, tableHeader }: { domainKey: string; ratings: RatingMap; rowHeight?: number; tableHeader?: string }) {
    const domain = FOUNDATIONAL_DOMAINS.find(d => d.key === domainKey)!;
    const rows: React.ReactNode[] = [];
    let i = 0;
    domain.sections.forEach(sec => {
        if (isSubSection(sec)) {
            rows.push(
                <tr key={`sub-${i++}`} style={{ background: C.subheadBg, pageBreakInside: 'avoid' }}>
                    <td colSpan={3} style={subheadTd}>{sec.subLabel}</td>
                </tr>
            );
            sec.skills.forEach(sub => {
                const rt1 = ratings[`TERM1:${domainKey}:${sub.key}`] || '';
                const rt2 = ratings[`TERM2:${domainKey}:${sub.key}`] || '';
                rows.push(
                    <tr key={sub.key} style={{ background: i++ % 2 === 0 ? C.rowOdd : C.rowEven, pageBreakInside: 'avoid', height: rowHeight }}>
                        <td style={{ ...obsTdStyle, paddingLeft: 24, width: '68%', textAlign: 'left' }}>{sub.label}</td>
                        <td style={{ ...obsTdStyle, textAlign: 'center' }}><Badge rating={rt1} /></td>
                        <td style={{ ...obsTdStyle, textAlign: 'center' }}><Badge rating={rt2} /></td>
                    </tr>
                );
            });
        } else {
            const rt1 = ratings[`TERM1:${domainKey}:${sec.key}`] || '';
            const rt2 = ratings[`TERM2:${domainKey}:${sec.key}`] || '';
            rows.push(
                <tr key={sec.key} style={{ background: i++ % 2 === 0 ? C.rowOdd : C.rowEven, pageBreakInside: 'avoid', height: rowHeight }}>
                    <td style={{ ...obsTdStyle, width: '68%', textAlign: 'left', paddingLeft: 24 }}>{sec.label}</td>
                    <td style={{ ...obsTdStyle, textAlign: 'center' }}><Badge rating={rt1} /></td>
                    <td style={{ ...obsTdStyle, textAlign: 'center' }}><Badge rating={rt2} /></td>
                </tr>
            );
        }
    });
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12.5, marginBottom: 6, pageBreakInside: 'avoid' }}>
            <thead>
                <tr>
                    <th style={{ ...obsThStyle, textAlign: 'left', width: '68%' }}>{tableHeader || 'Skills'}</th>
                    <th style={obsThStyle}>Term I</th>
                    <th style={obsThStyle}>Term II</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}

// ── PAGE WRAPPER ──────────────────────────────────────────────────────────────
function Page({ children, showHeader = false }: { children: React.ReactNode; showHeader?: boolean }) {
    return (
        <div className="print-page" style={{
            width: '210mm', minHeight: '293mm', margin: '0 auto 36px', background: C.white,
            borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
            boxSizing: 'border-box', position: 'relative'
        }}>
            {showHeader ? <SchoolHeader /> : <GoldBar />}
            <div style={{ padding: '22px 28px 28px', fontFamily: "'Nunito', 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif", fontSize: 13, color: C.text }}>
                {children}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTENT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function FoundationalReportContent({ autoPrint = true }: { autoPrint?: boolean }) {
    const searchParams = useSearchParams();
    const studentIdParam = searchParams.get('student_id') || searchParams.get('studentId') || '';
    const tokenParam = searchParams.get('token') || '';
    const ayIdParam = searchParams.get('academic_year_id') || '1';

    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = tokenParam || sessionStorage.getItem('hpc_token');
        const ayId = ayIdParam || '1';
        if (!token) { setError('Missing token'); return; }

        const id = studentIdParam || window.location.pathname.split('/').pop();

        fetch(`/api/reports/foundational/${id}?academic_year_id=${ayId}&token=${token}`)
            .then(r => r.json())
            .then(j => {
                if (j.success) {
                    setData(j.data);
                    if (autoPrint) {
                        if (document.fonts && document.fonts.ready) {
                            document.fonts.ready.then(() => setTimeout(() => window.print(), 500));
                        } else {
                            setTimeout(() => window.print(), 1000);
                        }
                    }
                } else {
                    setError(j.message || 'Failed to load');
                }
            })
            .catch(() => setError('Network error'));
    }, [tokenParam, ayIdParam, studentIdParam, autoPrint]);

    if (error) return <div style={{ padding: 40, color: 'red', textAlign: 'center', fontFamily: 'Arial' }}>{error}</div>;
    if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#666', fontFamily: 'Arial' }}>Loading report…</div>;

    const { student, attendance, ratings: rawRatings, textFields: rawText } = data;

    // Build lookup maps
    const ratings: RatingMap = {};
    rawRatings.forEach((r: any) => { ratings[`${r.term}:${r.domain}:${r.skill_key}`] = r.rating; });
    const texts: TextMap = {};
    rawText.forEach((t: any) => { texts[`${t.term}:${t.field_key}`] = t.field_value; });

    const getText = (term: string, key: string) => texts[`${term}:${key}`] || '';
    const getAnyText = (key: string) => texts[`TERM2:${key}`] || texts[`TERM1:${key}`] || '';

    const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const attMap: Record<string, { present: number; total: number }> = {};
    attendance.forEach((a: any) => { attMap[a.month] = { present: Number(a.present), total: Number(a.total) }; });

    const infoRow = (label: string, value: string) => (
        <>
            <div style={{ background: C.rowEven, padding: '9px 14px', fontWeight: 700, fontSize: 12.5, color: C.navy, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{label}</div>
            <div style={{ background: C.rowOdd, padding: '9px 14px', fontSize: 12.5, color: C.text, borderBottom: `1px solid ${C.border}` }}>{value}</div>
        </>
    );

    let calculatedAge = '';
    if (student.date_of_birth) {
        const dob = new Date(student.date_of_birth);
        if (!isNaN(dob.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            calculatedAge = age.toString();
        }
    }

    return (
        <div className="foundational-page" style={{ fontFamily: FONT_STACK, background: '#dde8f5', padding: '24px 12px' }}>

            {/* ── PAGE 1: General Info + Attendance + All About Me ── */}
            <Page showHeader>
                {/* GENERAL INFORMATION */}
                <div className="section" style={{ marginTop: 16 }}>
                    <h2 className="section-title">General Information</h2>
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                            <tbody>
                                <tr>
                                    <td className="g-label" style={{ width: 140 }}>Student Name:</td>
                                    <td colSpan={3} className="g-input">{student.student_name}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Roll No.:</td>
                                    <td className="g-input">{student.roll_no}</td>
                                    <td className="g-label" style={{ width: 90 }}>Adm No.:</td>
                                    <td className="g-input" style={{ width: '30%' }}>{student.admission_no}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Class / Section:</td>
                                    <td colSpan={3} className="g-input">{student.class_name || ''} {student.section_name ? '— ' + student.section_name : ''}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Date of Birth:</td>
                                    <td colSpan={3} className="g-input">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : ''}</td>
                                </tr>
                                <tr>
                                    <td className="g-label" style={{ height: 40 }}>Address:</td>
                                    <td colSpan={3} className="g-input">{student.address || ''}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Phone:</td>
                                    <td colSpan={3} className="g-input">{student.phone || ''}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Mother/Guardian Name:</td>
                                    <td colSpan={3} className="g-input">{student.mother_name || ''}</td>
                                </tr>
                                <tr>
                                    <td className="g-label">Father/Guardian Name:</td>
                                    <td colSpan={3} className="g-input">{student.father_name || ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ATTENDANCE RECORD */}
                <div className="section" style={{ marginTop: 10 }}>
                    <h2 className="section-title">Attendance Record</h2>
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Months</th>
                                {MONTHS.map(m => <th key={m}>{m}</th>)}
                                <th style={{ width: '8%' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>No. of Working days</td>
                                {MONTHS.map(m => <td key={m} className="input-cell">{attMap[m]?.total ?? ''}</td>)}
                                <td className="input-cell">{attendance.reduce((s: number, a: any) => s + Number(a.total), 0) || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>No. of Days Present</td>
                                {MONTHS.map(m => <td key={m} className="input-cell">{attMap[m]?.present ?? ''}</td>)}
                                <td className="input-cell">{attendance.reduce((s: number, a: any) => s + Number(a.present), 0) || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>% of attendance</td>
                                {MONTHS.map(m => {
                                    const att = attMap[m];
                                    return <td key={m} className="input-cell">{att && att.total ? Math.round((att.present / att.total) * 100) : ''}</td>;
                                })}
                                <td className="input-cell">
                                    {(() => {
                                        const totT = attendance.reduce((s: number, a: any) => s + Number(a.total), 0);
                                        const totP = attendance.reduce((s: number, a: any) => s + Number(a.present), 0);
                                        return totT ? Math.round((totP / totT) * 100) + '%' : '';
                                    })()}
                                </td>
                            </tr>
                            <tr>
                                <td style={{ fontWeight: 600, textAlign: 'left', paddingLeft: '5px' }}>If attendance is low then reason</td>
                                <td colSpan={13} className="input-cell" style={{ textAlign: 'left', paddingLeft: '8px' }}>
                                    {getAnyText('gi_attendance_reason')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: `10px 0 6px` }}>
                    <div style={{ width: 5, height: 22, background: C.gold, borderRadius: 3, flexShrink: 0 }} />
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        All About Me
                    </h3>
                </div>
                {/* My Age + My Best Friends */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '8px 0' }}>
                    {/* My Age */}
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: C.navy, color: C.white, fontWeight: 700, fontSize: 12, padding: '6px 14px' }}>My Age</div>
                        <div style={{ background: C.rowEven, padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 70 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}><CakeSVG /></div>
                            <div style={{ fontSize: 12, color: C.navy, display: 'flex', alignItems: 'center', gap: 6 }}>
                                I am
                                <span style={{ display: 'inline-block', borderBottom: `2px solid ${C.gold}`, minWidth: 40, textAlign: 'center', fontWeight: 800, fontSize: 15 }}>
                                    {calculatedAge || '\u00A0\u00A0\u00A0\u00A0'}
                                </span>
                                years old
                            </div>
                        </div>
                    </div>
                    {/* My Best Friends */}
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: C.navy, color: C.white, fontWeight: 700, fontSize: 12, padding: '6px 14px' }}>My Best Friends</div>
                        <div style={{ background: C.rowEven, padding: '10px 14px', minHeight: 70 }}>
                            {getAnyText('gi_best_friend') ? (
                                <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.5, padding: '2px 8px' }}>
                                    {getAnyText('gi_best_friend').split('\n').map((line, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <DotSVG />
                                            <span style={{ fontWeight: 600 }}>{line}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                [1, 2, 3].map(n => (
                                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <DotSVG />
                                        <div style={{ flex: 1, borderBottom: `1px solid ${C.border}`, height: 16 }} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 4 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12.5 }}>
                        <thead>
                            <tr>
                                <th style={{ ...obsThStyle, textAlign: 'left' }}>My favourite things to do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FAVOURITE_THINGS_FIELDS.map((f, ri) => (
                                <tr key={f.key} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven, height: 35 }}>
                                    <td style={{ ...obsTdStyle, textAlign: 'left', paddingLeft: 12 }}>
                                        {f.label} <span style={{ marginLeft: 8 }}>{getAnyText(f.key) || <span style={{ color: '#ccc' }}>________________________________</span>}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Page>

            {/* ── PAGE 2: Well-Being + Socio-Emotional + Aesthetic ── */}
            <Page>
                <SectionHeading mt={0}>Well-Being and Physical Development</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To develop gross and fine motor skills, coordination, independence, healthy habits, and positive participation in play.
                </p>
                <DomainTable domainKey="well_being" ratings={ratings} rowHeight={44} />

                <SectionHeading>Socio-Emotional Development</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To nurture emotional awareness, responsibility, cooperation, and positive social behaviour.
                </p>
                <DomainTable domainKey="socio_emotional" ratings={ratings} rowHeight={44} />

                <SectionHeading>Aesthetic and Cultural Development</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To encourage creativity, rhythm awareness, and artistic expression through art, music, and movement.
                </p>
                <DomainTable domainKey="aesthetic" ratings={ratings} rowHeight={44} />
            </Page>

            {/* ── PAGE 3: Language & Literacy ── */}
            <Page>
                <SectionHeading mt={0}>Language and Literacy Development</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To develop listening, speaking, reading, and writing skills for effective communication.
                </p>
                <DomainTable domainKey="language_english" ratings={ratings} tableHeader="English" />
                <div style={{ marginTop: 18 }} />
                <DomainTable domainKey="language_hindi" ratings={ratings} tableHeader="Hindi" />
            </Page>

            {/* ── PAGE 4: Cognitive + Learning Habits + Self-Assessment ── */}
            <Page>
                <SectionHeading mt={0}>Cognitive Development</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To build foundational numeracy, inquiry, problem-solving, and early technology skills.
                </p>
                <DomainTable domainKey="cognitive" ratings={ratings} rowHeight={40} />

                <SectionHeading>Positive Learning Habits</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px 15px', lineHeight: 1.5 }}>
                    <strong style={{ color: C.navy }}>Curricular Goals:</strong> To develop focus, responsibility, respect, and independence for lifelong learning.
                </p>
                <DomainTable domainKey="learning_habits" ratings={ratings} rowHeight={40} />

                <SectionHeading>Self-Assessment</SectionHeading>
                <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginBottom: 8 }}>
                    (Self reflection on inter-disciplinary activity done by the child)
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12.5 }}>
                    <thead>
                        <tr>
                            <th style={{ ...obsThStyle, textAlign: 'left', width: '60%' }}></th>
                            <th style={obsThStyle}>Term I</th>
                            <th style={obsThStyle}>Term II</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SELF_ASSESS_FIELDS.map((f, ri) => (
                            <tr key={f.key} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven, height: 44 }}>
                                <td style={{ ...obsTdStyle, textAlign: 'left', paddingLeft: 24 }}>{f.label}</td>
                                <td style={{ ...obsTdStyle, textAlign: 'center', fontSize: 11 }}>{getText('TERM1', f.key)}</td>
                                <td style={{ ...obsTdStyle, textAlign: 'center', fontSize: 11 }}>{getText('TERM2', f.key)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Page>

            {/* ── PAGE 5: Learner Profile + Parent Feedback + Signatures ── */}
            <Page>
                <SectionHeading mt={0}>Learner's Profile by the Teacher</SectionHeading>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, background: C.rowEven, minHeight: 140, padding: 12, fontSize: 12, marginTop: 6 }}>
                    {getText('TERM1', 'learner_profile') || getText('TERM2', 'learner_profile') || ''}
                </div>

                <SectionHeading>Parent's Feedback</SectionHeading>
                <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12.5 }}>
                    <thead>
                        <tr>
                            <th style={{ ...obsThStyle, textAlign: 'left', width: '55%' }}>Aspect</th>
                            <th style={obsThStyle}>Term I</th>
                            <th style={obsThStyle}>Term II</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PARENT_FEEDBACK_FIELDS.map((f, ri) => (
                            <tr key={f.key} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven, height: 52 }}>
                                <td style={{ ...obsTdStyle, textAlign: 'left', paddingLeft: 24 }}>{f.label}</td>
                                <td style={{ ...obsTdStyle, fontSize: 11, textAlign: 'center' }}>{getText('TERM1', f.key)}</td>
                                <td style={{ ...obsTdStyle, fontSize: 11, textAlign: 'center' }}>{getText('TERM2', f.key)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <SectionHeading>Signature with Date</SectionHeading>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                        <thead>
                            <tr>
                                {['Parent / Guardian', 'Class Teacher', 'Block Incharge', 'Principal'].map((h) => (
                                    <th key={h} style={{ ...obsThStyle, width: '25%', textTransform: 'uppercase', padding: '10px 14px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ background: C.white }}>
                                {[0, 1, 2, 3].map(i => <td key={i} style={{ ...obsTdStyle, height: 40 }} />)}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: 28 }} />
                <SectionHeading mt={0}>Assessment & Grading Framework</SectionHeading>
                <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12, marginTop: 8 }}>
                    <thead>
                        <tr>
                            <th style={{ ...obsThStyle, width: '12%' }}>Rating</th>
                            <th style={{ ...obsThStyle, width: '22%' }}>Level</th>
                            <th style={obsThStyle}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { badge: '★★★', color: C.tagA, level: 'Advanced', desc: 'Consistently demonstrates the skill independently with confidence, creativity, and beyond age-level expectations.' },
                            { badge: '★★', color: C.tagB, level: 'Age Appropriate', desc: 'Demonstrates understanding of the skill and applies it with confidence appropriate to their developmental stage.' },
                            { badge: '★', color: C.tagC, level: 'Getting There', desc: 'Requires support and encouragement to understand and apply the skill effectively; still developing at their own pace.' },
                        ].map((r, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven }}>
                                <td style={{ ...obsTdStyle, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {r.badge.split('').map((_, i) => <StarSVG key={i} color={r.color} />)}
                                    </div>
                                </td>
                                <td style={{ ...obsTdStyle, fontWeight: 700 }}>{r.level}</td>
                                <td style={obsTdStyle}>{r.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ background: C.subheadBg, borderLeft: `4px solid ${C.gold}`, borderRadius: 4, padding: '10px 14px', fontSize: 12, color: C.navy, marginTop: 20, lineHeight: 1.5 }}>
                    <strong>Domains Assessed in this Foundational Stage HPC:</strong><br />
                    Well-Being & Physical Development · Socio-Emotional Development · Aesthetic & Cultural Development ·
                    Language & Literacy (English & Hindi) · Cognitive Development (Numeracy, EVS & ICT) · Positive Learning Habits
                </div>
            </Page>

            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <style>{`
                ${PRINT_STYLES}
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');
                html, body { margin: 0; padding: 0; }
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
                    .foundational-page { 
                        padding: 0 !important; 
                        background: white !important;
                        width: 100% !important;
                    }
                    .print-page { 
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        page-break-after: always; 
                        break-after: page; 
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }
                    .print-page:last-of-type { 
                        page-break-after: auto; 
                        break-after: auto; 
                    }
                    * { box-sizing: border-box; }
                }

                /* Foundational specifics overrides */
                .foundational-page {
                    font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Arial Unicode MS', 'Nunito', 'Segoe UI', Arial, sans-serif !important;
                }
                .foundational-page .section-title {
                    font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Arial Unicode MS', 'Nunito', 'Segoe UI', Arial, sans-serif !important;
                    text-transform: uppercase;
                    border-bottom: none !important;
                }
                .foundational-page .g-label {
                    background: ${C.paleBg};
                    font-weight: 700;
                    color: ${C.navy};
                    padding: 8px 12px;
                    border-bottom: 1px solid ${C.border};
                    border-right: 1px solid ${C.border};
                    vertical-align: middle;
                    text-align: left;
                    font-size: 11.5px;
                }
                .foundational-page .g-input {
                    background: ${C.white};
                    color: ${C.text};
                    padding: 8px 12px;
                    border-bottom: 1px solid ${C.border};
                    vertical-align: middle;
                    text-align: left;
                    font-size: 11.5px;
                }
                .foundational-page tr:last-child .g-label,
                .foundational-page tr:last-child .g-input {
                    border-bottom: none;
                }
                .foundational-page .attendance-table th {
                    background: ${C.navy} !important;
                    color: ${C.white} !important;
                    font-weight: 700;
                    padding: 9px 14px !important;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.15);
                    font-size: 10.5px;
                }
                .foundational-page .attendance-table th:last-child {
                    background: ${C.gold} !important;
                }
                .foundational-page .attendance-table td {
                    padding: 8px 3px !important;
                    border: 1px solid ${C.border};
                    color: ${C.text};
                    vertical-align: middle;
                    font-size: 11px;
                }
                .foundational-page .attendance-table td:first-child,
                .foundational-page .attendance-table td:last-child {
                    background: ${C.rowEven} !important;
                }
            `}</style>        </div>
    );
}

export default function FoundationalReportPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#666' }}>Loading report…</div>}>
            <FoundationalReportContent />
        </Suspense>
    );
}
