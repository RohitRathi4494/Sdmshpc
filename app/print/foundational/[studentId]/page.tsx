'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FOUNDATIONAL_DOMAINS, SELF_ASSESS_FIELDS, PARENT_FEEDBACK_FIELDS,
    RATINGS, isSubSection,
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

// ── Helper: render a star rating badge ───────────────────────────────────────
function Badge({ rating }: { rating: string }) {
    if (!rating) return <span style={{ color: '#bbb' }}>—</span>;
    const r = RATINGS.find(x => x.value === rating);
    return (
        <span style={{
            background: ratingColor(rating), color: '#fff',
            borderRadius: 4, padding: '2px 8px', fontWeight: 700, fontSize: 11,
        }}>
            {r?.stars ?? rating}
        </span>
    );
}

// ── Shared table styles ───────────────────────────────────────────────────────
const obsThStyle: React.CSSProperties = {
    background: C.navy, color: C.white, fontWeight: 700,
    padding: '9px 14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)',
};
const obsTdStyle: React.CSSProperties = {
    padding: '8px 14px', border: `1px solid ${C.border}`,
    color: C.text, verticalAlign: 'middle', fontSize: 12,
};
const subheadTd: React.CSSProperties = {
    background: C.subheadBg, color: C.navy, fontWeight: 700,
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
function DomainTable({ domainKey, ratings, rowHeight }: { domainKey: string; ratings: RatingMap; rowHeight?: number }) {
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
                        <td style={{ ...obsTdStyle, paddingLeft: 24, width: '68%' }}>{sub.label}</td>
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
                    <td style={{ ...obsTdStyle, width: '68%' }}>{sec.label}</td>
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
                    <th style={{ ...obsThStyle, textAlign: 'left', width: '68%' }}>Skills</th>
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
            <div style={{ padding: '22px 28px 28px', fontFamily: "'Nunito', 'Segoe UI', Arial, sans-serif", fontSize: 13, color: C.text }}>
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
                        setTimeout(() => window.print(), 800);
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

    const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const attMap: Record<string, { present: number; total: number }> = {};
    attendance.forEach((a: any) => { attMap[a.month] = { present: Number(a.present), total: Number(a.total) }; });

    const infoRow = (label: string, value: string) => (
        <>
            <div style={{ background: C.rowEven, padding: '9px 14px', fontWeight: 700, fontSize: 12.5, color: C.navy, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>{label}</div>
            <div style={{ background: C.rowOdd, padding: '9px 14px', fontSize: 12.5, color: C.text, borderBottom: `1px solid ${C.border}` }}>{value}</div>
        </>
    );

    return (
        <div className="foundational-page" style={{ fontFamily: "'Nunito', 'Segoe UI', Arial, sans-serif", background: '#dde8f5', padding: '24px 12px' }}>

            {/* ── PAGE 1: General Info + Attendance + All About Me ── */}
            <Page showHeader>
                {/* GENERAL INFORMATION */}
                <div className="section" style={{ marginTop: 16 }}>
                    <h2 className="section-title">General Information</h2>
                    <div className="info-grid">
                        <div className="info-row">
                            <div className="info-label">Student Name:</div>
                            <div className="info-input">{student.student_name}</div>
                        </div>
                        <div className="info-row-split">
                            <div className="info-row-half">
                                <div className="info-label">Roll No.:</div>
                                <div className="info-input">{student.roll_no}</div>
                            </div>
                            <div className="info-row-compact">
                                <div className="info-label" style={{ marginLeft: 20 }}>Adm No.:</div>
                                <div className="info-input">{student.admission_no}</div>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Class / Section:</div>
                            <div className="info-input">{student.class_name || ''} {student.section_name ? '— ' + student.section_name : ''}</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Date of Birth:</div>
                            <div className="info-input">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB') : ''}</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Address:</div>
                            <div className="info-input" style={{ minHeight: '40px' }}>{student.address || ''}</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Phone:</div>
                            <div className="info-input">{student.phone || ''}</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Mother/Guardian Name:</div>
                            <div className="info-input">{student.mother_name || ''}</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Father/Guardian Name:</div>
                            <div className="info-input">{student.father_name || ''}</div>
                        </div>
                    </div>
                </div>

                {/* ATTENDANCE RECORD */}
                <div className="section" style={{ marginTop: 16 }}>
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
                                <td colSpan={13} className="input-cell"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <SectionHeading mt={20}>All About Me</SectionHeading>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
                    {['My Self', 'My Family Photo'].map(title => (
                        <div key={title} style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                            <div style={{ background: C.navy, color: C.white, fontWeight: 700, fontSize: 12.5, padding: '8px 14px' }}>{title}</div>
                            <div style={{ background: C.rowEven, padding: 12, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontStyle: 'italic', fontSize: 12, border: '1.5px dashed #c9d8ee', margin: 10, borderRadius: 6 }}>
                                Paste Photo Here
                            </div>
                        </div>
                    ))}
                </div>

                {/* My Age + My Best Friends */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                    {/* My Age */}
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: C.navy, color: C.white, fontWeight: 700, fontSize: 12.5, padding: '8px 14px' }}>My Age</div>
                        <div style={{ background: C.rowEven, padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}>
                            <div style={{ fontSize: 32, marginBottom: 4 }}>🎂</div>
                            <div style={{ fontSize: 13, color: C.navy }}>
                                I am{' '}
                                <span style={{ display: 'inline-block', borderBottom: `2px solid ${C.gold}`, minWidth: 40, textAlign: 'center', fontWeight: 700 }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                {' '}years old
                            </div>
                        </div>
                    </div>
                    {/* My Best Friends */}
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', pageBreakInside: 'avoid' }}>
                        <div style={{ background: C.navy, color: C.white, fontWeight: 700, fontSize: 12.5, padding: '8px 14px' }}>My Best Friends</div>
                        <div style={{ background: C.rowEven, padding: '12px 14px', minHeight: 110 }}>
                            {[1, 2, 3].map(n => (
                                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ color: C.gold, fontSize: 16 }}>●</span>
                                    <div style={{ flex: 1, borderBottom: `1px solid ${C.border}`, height: 20 }} />
                                </div>
                            ))}
                        </div>
                    </div>
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
                <DomainTable domainKey="language_english" ratings={ratings} />
                <div style={{ marginTop: 18 }} />
                <DomainTable domainKey="language_hindi" ratings={ratings} />
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
                                <td style={obsTdStyle}>{f.label}</td>
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
                                <td style={obsTdStyle}>{f.label}</td>
                                <td style={{ ...obsTdStyle, fontSize: 11 }}>{getText('TERM1', f.key)}</td>
                                <td style={{ ...obsTdStyle, fontSize: 11 }}>{getText('TERM2', f.key)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <SectionHeading>Signature with Date</SectionHeading>
                <table style={{ width: '100%', borderCollapse: 'collapse', outline: `1px solid ${C.border}`, fontSize: 12.5 }}>
                    <thead>
                        <tr>
                            {['Term', 'Parent / Guardian', 'Class Teacher', 'Block Incharge', 'Principal'].map((h, i) => (
                                <th key={h} style={{ ...obsThStyle, width: i === 0 ? '12%' : undefined }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {['Term I', 'Term II'].map((t, ri) => (
                            <tr key={t} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven }}>
                                <td style={{ ...obsTdStyle, fontWeight: 700, color: C.navy }}>{t}</td>
                                {[0, 1, 2, 3].map(i => <td key={i} style={{ ...obsTdStyle, height: 52 }} />)}
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                            { badge: 'A', bg: C.tagA, level: 'Advanced', desc: 'Consistently demonstrates the skill independently with confidence, creativity, and beyond age-level expectations.' },
                            { badge: 'B', bg: C.tagB, level: 'Age Appropriate', desc: 'Demonstrates understanding of the skill and applies it with confidence appropriate to their developmental stage.' },
                            { badge: 'C', bg: C.tagC, level: 'Getting There', desc: 'Requires support and encouragement to understand and apply the skill effectively; still developing at their own pace.' },
                        ].map((r, ri) => (
                            <tr key={ri} style={{ background: ri % 2 === 0 ? C.rowOdd : C.rowEven }}>
                                <td style={{ ...obsTdStyle, textAlign: 'center' }}>
                                    <span style={{ background: r.bg, color: '#fff', borderRadius: 4, padding: '2px 9px', fontWeight: 700, fontSize: 12 }}>{r.badge}</span>
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

            <style>{`
                ${PRINT_STYLES}
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
                html, body { margin: 0; padding: 0; }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        width: 210mm;
                        height: 297mm;
                    }
                    .foundational-page { 
                        padding: 0 !important; 
                        background: white !important;
                    }
                    .print-page { 
                        page-break-after: always; 
                        break-after: page; 
                        margin-bottom: 0 !important;
                        box-shadow: none !important;
                    }
                    .print-page:last-of-type { 
                        page-break-after: auto; 
                        break-after: auto; 
                    }
                    * { box-sizing: border-box; }
                }

                /* Foundational specifics overrides */
                .foundational-page {
                    font-family: 'Nunito', 'Segoe UI', Arial, sans-serif !important;
                }
                .foundational-page .section-title {
                    font-family: 'Nunito', 'Segoe UI', Arial, sans-serif !important;
                    text-transform: uppercase;
                    border-bottom: none !important;
                }
                .foundational-page .info-grid {
                    border: 1px solid ${C.border};
                    border-radius: 6px;
                    padding: 0;
                    background: transparent;
                }
                .foundational-page .info-row,
                .foundational-page .info-row-half,
                .foundational-page .info-row-split {
                    margin-bottom: 0;
                    gap: 0;
                }
                .foundational-page .info-label {
                    background: ${C.rowEven};
                    padding: 9px 14px;
                    font-weight: 700;
                    font-size: 12.5px;
                    color: ${C.navy} !important;
                    border-bottom: 1px solid ${C.border};
                    border-right: 1px solid ${C.border};
                    display: flex;
                    align-items: center;
                }
                .foundational-page .info-input {
                    background: ${C.rowOdd};
                    padding: 9px 14px;
                    font-size: 12.5px;
                    color: ${C.text};
                    border: none;
                    border-bottom: 1px solid ${C.border};
                    min-height: auto;
                    border-radius: 0;
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
