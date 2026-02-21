'use client';

import { useState, useEffect } from 'react';

interface StudentFormProps {
    student?: any; // If provided, edit mode
    classes: any[];
    sections: any[];
    academicYearId?: number;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export default function StudentForm({ student = {}, classes = [], sections = [], academicYearId, onSave, onCancel }: StudentFormProps) {
    const [formData, setFormData] = useState({
        // Basic
        student_name: student.student_name || '',
        admission_no: student.admission_no || '',
        admission_date: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || 'Male',
        blood_group: student.blood_group || '',
        category: student.category || 'General',

        // Senior Secondary Spec
        stream: student.stream || '',
        subject_count: student.subject_count || 5,

        // Family
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',

        // Contact
        address: student.address || '',
        phone_no: student.phone_no || '',
        emergency_no: student.emergency_no || '',

        // IDs
        aadhar_no: student.aadhar_no || '',
        ppp_id: student.ppp_id || '',
        apaar_id: student.apaar_id || '',
        srn_no: student.srn_no || '',
        education_reg_no: student.education_reg_no || '',
        board_roll_x: student.board_roll_x || '',
        board_roll_xii: student.board_roll_xii || '',

        // Enrollment
        class_id: student.class_id || (student.section_id ? sections.find(s => s.id === student.section_id)?.class_id : '') || '',
        section_id: student.section_id || '',
        roll_no: student.roll_no || '',

        // Fee flag
        is_new_student: student.is_new_student ?? false,
    });

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleClassChange = (e: any) => {
        const clsId = parseInt(e.target.value);
        setFormData(prev => ({ ...prev, class_id: clsId, section_id: '' })); // Reset section when class changes
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const filteredSections = sections.filter(s => s.class_id == formData.class_id);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">

            {/* 1. Academic & Admission */}
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Admission Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Admission No *</label>
                        <input type="text" name="admission_no" value={formData.admission_no} onChange={handleChange} required className="w-full border rounded p-2 text-sm" />
                    </div>
                    {student.student_code && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500">Student Code (System)</label>
                            <input type="text" value={student.student_code} disabled className="w-full border rounded p-2 text-sm bg-gray-100 text-gray-500" />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Admission Date</label>
                        <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    {/* Enrollment (Only show if we have sections to pick, implies we are in a context where we can set it) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Class</label>
                        <select name="class_id" value={formData.class_id} onChange={handleClassChange} className="w-full border rounded p-2 text-sm">
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500">Section</label>
                        <select
                            name="section_id"
                            value={formData.section_id}
                            onChange={(e) => setFormData({ ...formData, section_id: parseInt(e.target.value) })}
                            className="w-full border rounded p-2 text-sm"
                            disabled={!formData.class_id}
                        >
                            <option value="">Select Section</option>
                            {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Roll No</label>
                        <input type="number" name="roll_no" value={formData.roll_no} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>

                {/* New Student Toggle */}
                <div className="mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <input
                        type="checkbox"
                        id="is_new_student"
                        name="is_new_student"
                        checked={formData.is_new_student}
                        onChange={handleChange}
                        className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500"
                    />
                    <label htmlFor="is_new_student" className="text-sm font-semibold text-amber-800 cursor-pointer select-none">
                        🆕 New Student
                        <span className="ml-1 text-xs font-normal text-amber-600">
                            (Check if joining for the first time — will show one-time fees like Admission Fee)
                        </span>
                    </label>
                </div>
            </div>

            {/* 1.5 Academic Details (Senior Secondary) */}
            {(() => {
                const selectedClass = classes.find(c => c.id == formData.class_id);
                // Simple heuristic for Class XI/XII - can be improved if class structure is known
                // Checks for '11', '12', 'XI', 'XII' in class name.
                const isSenior = selectedClass && /(11|12|XI|XII)/i.test(selectedClass.class_name);

                if (isSenior) return (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                        <h4 className="text-sm font-semibold text-yellow-800 uppercase mb-3">Senior Secondary Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Stream</label>
                                <select name="stream" value={formData.stream} onChange={handleChange} className="w-full border rounded p-2 text-sm bg-white">
                                    <option value="">Select Stream</option>
                                    <option value="Medical">Medical</option>
                                    <option value="Non-Medical">Non-Medical</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="Arts">Arts</option>
                                    <option value="Humanities">Humanities</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Subject Count (for Fee Calculation)</label>
                                <select name="subject_count" value={formData.subject_count} onChange={(e) => setFormData({ ...formData, subject_count: parseInt(e.target.value) })} className="w-full border rounded p-2 text-sm bg-white">
                                    <option value="5">5 Subjects</option>
                                    <option value="6">6 Subjects</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
                return null;
            })()}

            {/* 2. Personal Details */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3 text-indigo-600">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500">Student Name *</label>
                        <input type="text" name="student_name" value={formData.student_name} onChange={handleChange} required className="w-full border rounded p-2 text-sm font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Date of Birth *</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Blood Group</label>
                        <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Category</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded p-2 text-sm">
                            <option value="General">General</option>
                            <option value="SC">SC</option>
                            <option value="BC">BC</option>
                            <option value="OBC">OBC</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. Family & Contact */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3 text-indigo-600">Family & Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Father Name *</label>
                        <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} required className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Mother Name</label>
                        <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Phone No</label>
                        <input type="text" name="phone_no" value={formData.phone_no} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Emergency No</label>
                        <input type="text" name="emergency_no" value={formData.emergency_no} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>
            </div>

            {/* 4. Official IDs */}
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Official IDs</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Aadhar No</label>
                        <input type="text" name="aadhar_no" value={formData.aadhar_no} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">APAAR ID</label>
                        <input type="text" name="apaar_id" value={formData.apaar_id} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">PPP ID</label>
                        <input type="text" name="ppp_id" value={formData.ppp_id} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">SRN No</label>
                        <input type="text" name="srn_no" value={formData.srn_no} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Board Roll (X)</label>
                        <input type="text" name="board_roll_x" value={formData.board_roll_x} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Board Roll (XII)</label>
                        <input type="text" name="board_roll_xii" value={formData.board_roll_xii} onChange={handleChange} className="w-full border rounded p-2 text-sm" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 text-sm font-medium shadow-sm">
                    Save Student
                </button>
            </div>
        </form>
    );
}
