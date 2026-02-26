'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    FOUNDATIONAL_DOMAINS, SELF_ASSESS_FIELDS, PARENT_FEEDBACK_FIELDS,
    RATINGS, isSubSection, type Rating
} from '@/app/lib/foundational-skills';

const TERMS = [
    { key: 'TERM1', label: 'Term I' },
    { key: 'TERM2', label: 'Term II' },
] as const;

type TermKey = 'TERM1' | 'TERM2';

function HPCEntryContent({ studentId }: { studentId: string }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const academicYearId = searchParams.get('academic_year_id') || '1';

    const [activeTerm, setActiveTerm] = useState<TermKey>('TERM1');
    const [studentName, setStudentName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentSection, setStudentSection] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // {term}:{domain}:{skillKey} → Rating
    const [ratings, setRatings] = useState<Record<string, Rating>>({});
    // {term}:{fieldKey} → string
    const [textFields, setTextFields] = useState<Record<string, string>>({});

    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState('');
    const [saveError, setSaveError] = useState('');
    const textDebounce = useRef<NodeJS.Timeout | null>(null);

    const token = () => sessionStorage.getItem('hpc_token') || '';
    const authH = useCallback(() => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
    }), []);

    // Load student name + class/section
    useEffect(() => {
        fetch(`/api/teacher/students?student_id=${studentId}`, { headers: authH() })
            .then(r => r.json())
            .then(j => {
                if (j.success && j.data?.[0]) {
                    const s = j.data[0];
                    setStudentName(s.student_name || '');
                    setStudentClass(s.class_name || '');
                    setStudentSection(s.section_name || '');
                }
            })
            .catch(() => { });
    }, [studentId, authH]);

    // Load existing data
    useEffect(() => {
        const url = `/api/teacher/foundational-ratings?student_id=${studentId}&academic_year_id=${academicYearId}`;
        fetch(url, { headers: authH() }).then(r => r.json()).then(j => {
            if (!j.success) return;
            const map: Record<string, Rating> = {};
            j.data.forEach((r: any) => { map[`${r.term}:${r.domain}:${r.skill_key}`] = r.rating; });
            setRatings(map);
        });

        const urlT = `/api/teacher/foundational-text?student_id=${studentId}&academic_year_id=${academicYearId}`;
        fetch(urlT, { headers: authH() }).then(r => r.json()).then(j => {
            if (!j.success) return;
            const map: Record<string, string> = {};
            j.data.forEach((r: any) => { map[`${r.term}:${r.field_key}`] = r.field_value || ''; });
            setTextFields(map);
        });
    }, [studentId, academicYearId, authH]);

    // Rate a skill (instant save)
    const handleRate = useCallback(async (domain: string, skillKey: string, newRating: Rating) => {
        const mapKey = `${activeTerm}:${domain}:${skillKey}`;
        const prev = ratings[mapKey];
        const value = prev === newRating ? '' : newRating; // toggle off

        setRatings(r => ({ ...r, [mapKey]: value as Rating }));
        setSaving(true);
        setSaveError('');
        try {
            const res = await fetch('/api/teacher/foundational-ratings', {
                method: 'POST', headers: authH(),
                body: JSON.stringify({
                    student_id: parseInt(studentId), academic_year_id: parseInt(academicYearId),
                    term: activeTerm, domain, skill_key: skillKey, rating: value || null,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                setSaveError(json.message || 'Save failed');
            } else {
                setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
            }
        } catch (e: any) {
            setSaveError(e.message || 'Network error');
        } finally { setSaving(false); }
    }, [activeTerm, ratings, studentId, academicYearId, authH]);

    // Text field (debounced 600ms)
    const handleText = useCallback((fieldKey: string, value: string) => {
        const mapKey = `${activeTerm}:${fieldKey}`;
        setTextFields(f => ({ ...f, [mapKey]: value }));
        if (textDebounce.current) clearTimeout(textDebounce.current);
        textDebounce.current = setTimeout(async () => {
            setSaving(true);
            setSaveError('');
            try {
                const res = await fetch('/api/teacher/foundational-text', {
                    method: 'POST', headers: authH(),
                    body: JSON.stringify({
                        student_id: parseInt(studentId), academic_year_id: parseInt(academicYearId),
                        term: activeTerm, field_key: fieldKey, field_value: value,
                    }),
                });
                const json = await res.json();
                if (!res.ok || !json.success) {
                    setSaveError(json.message || 'Save failed');
                } else {
                    setLastSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
                }
            } catch (e: any) {
                setSaveError(e.message || 'Network error');
            } finally { setSaving(false); }
        }, 600);
    }, [activeTerm, studentId, academicYearId, authH]);

    const getRating = (domain: string, skillKey: string): Rating =>
        (ratings[`${activeTerm}:${domain}:${skillKey}`] as Rating) || '';
    const getText = (fieldKey: string): string =>
        textFields[`${activeTerm}:${fieldKey}`] || '';

    return (
        <div className="max-w-4xl mx-auto pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1">
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            Holistic Progress Card Entry
                        </h1>
                        {studentName && <p className="text-sm text-gray-500">{studentName}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    {saving ? (
                        <span className="text-amber-600 animate-pulse">● Saving…</span>
                    ) : saveError ? (
                        <span className="text-red-600 text-xs bg-red-50 border border-red-200 px-2 py-1 rounded">⚠ {saveError}</span>
                    ) : lastSaved ? (
                        <span className="text-green-600">✓ Saved {lastSaved}</span>
                    ) : null}
                    <button
                        onClick={() => setShowPreview(true)}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        🖨 Preview Card
                    </button>
                </div>
            </div>

            {/* Term Tabs */}
            <div className="flex gap-2 mb-6">
                {TERMS.map(t => (
                    <button key={t.key} onClick={() => setActiveTerm(t.key)}
                        className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${activeTerm === t.key ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Rating Legend */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex flex-wrap gap-4 text-sm">
                <span className="font-semibold text-blue-800">Rating Scale:</span>
                {RATINGS.map(r => (
                    <span key={r.value} className="flex items-center gap-1.5">
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded font-bold text-white text-xs" style={{ background: r.color }}>{r.value}</span>
                        <span className="text-gray-600">{r.meaning}</span>
                    </span>
                ))}
                <span className="text-gray-400 text-xs self-center">· Click the same rating again to clear it</span>
            </div>

            {/* Domains */}
            {FOUNDATIONAL_DOMAINS.map(domain => (
                <div key={domain.key} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                    <div className="bg-[#1B3D6F] text-white px-5 py-3">
                        <div className="font-bold text-sm">{domain.label}</div>
                        <div className="text-xs opacity-70 mt-0.5">{domain.currGoal}</div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {domain.sections.map((section, i) => {
                            if (isSubSection(section)) {
                                return (
                                    <div key={i}>
                                        <div className="bg-[#dbe8fa] px-5 py-2 text-xs font-bold text-[#1B3D6F] uppercase tracking-wide">
                                            {section.subLabel}
                                        </div>
                                        {section.skills.map(skill => (
                                            <SkillRow key={skill.key} skill={skill} domain={domain.key}
                                                rating={getRating(domain.key, skill.key)}
                                                onRate={handleRate} />
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <SkillRow key={section.key} skill={section} domain={domain.key}
                                    rating={getRating(domain.key, section.key)}
                                    onRate={handleRate} />
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Self-Assessment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                <div className="bg-[#1B3D6F] text-white px-5 py-3">
                    <div className="font-bold text-sm">Self-Assessment</div>
                    <div className="text-xs opacity-70 mt-0.5">Teacher fills based on observation and discussion with the child</div>
                </div>
                <div className="p-5 space-y-4">
                    {SELF_ASSESS_FIELDS.map(f => (
                        <div key={f.key}>
                            <label className="block text-sm text-gray-700 mb-1">{f.label}</label>
                            <input type="text" value={getText(f.key)}
                                onChange={e => handleText(f.key, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                placeholder="Type here…" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Learner's Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                <div className="bg-[#1B3D6F] text-white px-5 py-3 font-bold text-sm">Learner's Profile by the Teacher</div>
                <div className="p-5">
                    <textarea rows={5} value={getText('learner_profile')}
                        onChange={e => handleText('learner_profile', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                        placeholder="Describe the learner's overall strengths, interests, and areas of growth…" />
                </div>
            </div>

            {/* Parent Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                <div className="bg-[#1B3D6F] text-white px-5 py-3 font-bold text-sm">Parent's Feedback</div>
                <div className="p-5 space-y-4">
                    {PARENT_FEEDBACK_FIELDS.map(f => (
                        <div key={f.key}>
                            <label className="block text-sm text-gray-700 mb-1">{f.label}</label>
                            <input type="text" value={getText(f.key)}
                                onChange={e => handleText(f.key, e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                                placeholder="Type here…" />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Preview Modal ── */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
                    <div className="flex items-center justify-between bg-[#1B3D6F] px-5 py-3 shrink-0">
                        <span className="text-white font-semibold text-sm">
                            Preview — {studentName}{studentClass && studentSection ? ` (${studentClass} ${studentSection})` : ''}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const iframe = document.getElementById('hpc-preview-frame') as HTMLIFrameElement;
                                    if (iframe?.contentWindow) {
                                        const fileName = [studentName, studentClass, studentSection].filter(Boolean).join('_').replace(/\s+/g, '_');
                                        if (iframe.contentDocument) iframe.contentDocument.title = fileName;
                                        iframe.contentWindow.print();
                                    }
                                }}
                                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition"
                            >
                                ⬇ Download PDF
                            </button>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    <iframe
                        id="hpc-preview-frame"
                        src={`/print/foundational/${studentId}?academic_year_id=${academicYearId}&token=${token()}`}
                        className="flex-1 w-full bg-white border-0"
                        title="HPC Preview"
                    />
                </div>
            )}
        </div>
    );
}

function SkillRow({ skill, domain, rating, onRate }: {
    skill: { key: string; label: string };
    domain: string;
    rating: Rating;
    onRate: (domain: string, skillKey: string, r: Rating) => void;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 gap-3">
            <span className="text-sm text-gray-700 flex-1">{skill.label}</span>
            <div className="flex gap-1.5 shrink-0">
                {RATINGS.map(r => (
                    <button key={r.value} onClick={() => onRate(domain, skill.key, r.value as Rating)}
                        title={r.meaning}
                        className="w-8 h-8 rounded-lg text-xs font-bold transition border-2"
                        style={{
                            background: rating === r.value ? r.color : r.light,
                            color: rating === r.value ? '#fff' : r.color,
                            borderColor: rating === r.value ? r.color : 'transparent',
                        }}
                    >
                        {r.value}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function HPCEntryPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading…</div>}>
            <HPCEntryContent studentId={params.id} />
        </Suspense>
    );
}
