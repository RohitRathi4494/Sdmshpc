'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/app/lib/api-client';
import Modal from '@/app/components/ui/Modal';

interface ClassData {
    id: number;
    class_name: string;
    display_order: number;
}

interface SectionData {
    id: number;
    class_id: number;
    section_name: string;
    class_teacher_id?: number;
    teacher_name?: string;
}

interface Teacher {
    id: number;
    full_name: string;
}

export default function ClassesPage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [sections, setSections] = useState<Record<number, SectionData[]>>({});
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

    // Form State
    const [newClassName, setNewClassName] = useState('');
    const [newClassOrder, setNewClassOrder] = useState('');

    // Section Form
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [editingSection, setEditingSection] = useState<SectionData | null>(null);
    const [sectionForm, setSectionForm] = useState({
        section_name: '',
        class_teacher_id: ''
    });

    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('hpc_token') || '';

            // Fetch Classes
            const classesData = await ApiClient.get<ClassData[]>('/admin/classes', token);
            setClasses(classesData);

            // Fetch All Sections
            const sectionsData = await ApiClient.get<SectionData[]>('/admin/sections', token);

            const sectionsMap: Record<number, SectionData[]> = {};
            sectionsData.forEach(sec => {
                if (!sectionsMap[sec.class_id]) sectionsMap[sec.class_id] = [];
                sectionsMap[sec.class_id].push(sec);
            });
            setSections(sectionsMap);

            // Fetch Teachers
            const teachersData = await ApiClient.get<Teacher[]>('/admin/teachers', token);
            setTeachers(teachersData);

        } catch (error) {
            console.error('Failed to fetch data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        setSaving(true);
        try {
            const token = sessionStorage.getItem('hpc_token') || '';
            await ApiClient.post('/admin/classes', {
                class_name: newClassName,
                display_order: parseInt(newClassOrder) || 0
            }, token);

            setNewClassName('');
            setNewClassOrder('');
            setIsClassModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to create class');
        } finally {
            setSaving(false);
        }
    };

    const openSectionModal = (classId: number, section?: SectionData) => {
        setSelectedClassId(classId);
        if (section) {
            setEditingSection(section);
            setSectionForm({
                section_name: section.section_name,
                class_teacher_id: section.class_teacher_id?.toString() || ''
            });
        } else {
            setEditingSection(null);
            setSectionForm({
                section_name: '',
                class_teacher_id: ''
            });
        }
        setIsSectionModalOpen(true);
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId || !sectionForm.section_name.trim()) return;

        setSaving(true);
        const token = sessionStorage.getItem('hpc_token') || '';

        try {
            const payload: any = {
                class_id: selectedClassId,
                section_name: sectionForm.section_name,
                class_teacher_id: sectionForm.class_teacher_id ? parseInt(sectionForm.class_teacher_id) : null
            };

            if (editingSection) {
                // Update
                delete payload.class_id; // class_id not editable usually
                await ApiClient.put(`/admin/sections/${editingSection.id}`, payload, token);
            } else {
                // Create
                await ApiClient.post('/admin/sections', payload, token);
            }

            setIsSectionModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to save section');
        } finally {
            setSaving(false);
        }
    };


    const router = useRouter();

    return (
        <div>
            <div className="flex items-center mb-6">
                <button
                    onClick={() => router.back()}
                    className="mr-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Classes & Sections</h1>
            </div>
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => setIsClassModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                    <span className="mr-2 text-xl">+</span> Add Class
                </button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : classes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No classes defined.</div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-gray-800">{cls.class_name}</span>
                                    <span className="ml-3 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Order: {cls.display_order}</span>
                                </div>
                                <button
                                    onClick={() => openSectionModal(cls.id)}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    + Add Section
                                </button>
                            </div>
                            <div className="p-6">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sections[cls.id]?.length > 0 ? (
                                        sections[cls.id].map(sec => (
                                            <div
                                                key={sec.id}
                                                className="px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
                                            >
                                                <div>
                                                    <span className="font-medium text-gray-800">{sec.section_name}</span>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {sec.teacher_name || 'No Class Teacher'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openSectionModal(cls.id, sec)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-all p-1"
                                                    title="Edit Section"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No sections added yet.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Class Modal */}
            <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Add New Class">
                <form onSubmit={handleCreateClass}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name (e.g. Class 1)</label>
                            <input
                                type="text"
                                required
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Class Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Order (e.g. 1)</label>
                            <input
                                type="number"
                                required
                                value={newClassOrder}
                                onChange={(e) => setNewClassOrder(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Numeric Order"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Class'}</button>
                    </div>
                </form>
            </Modal>

            {/* Add/Edit Section Modal */}
            <Modal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                title={editingSection ? `Edit Section` : `Add New Section`}
            >
                <form onSubmit={handleSaveSection}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section Name (e.g. A, Rose)
                            </label>
                            <input
                                type="text"
                                required
                                value={sectionForm.section_name}
                                onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Section Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class Teacher
                            </label>
                            <select
                                value={sectionForm.class_teacher_id}
                                onChange={(e) => setSectionForm({ ...sectionForm, class_teacher_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select a Teacher (Optional)</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.full_name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Assign a class teacher to manage this section.</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Section'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
