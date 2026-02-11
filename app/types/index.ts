export interface AcademicYear {
    id: number;
    year_name: string;
    is_active: boolean;
}

export interface Class {
    id: number;
    class_name: string;
    display_order: number;
}

export interface Section {
    id: number;
    class_id: number;
    section_name: string;
}

export interface Subject {
    id: number;
    subject_name: string;
}

export interface Term {
    id: number;
    term_name: string;
}

export interface Student {
    id: number;
    admission_no: string;
    student_name: string;
    father_name: string;
    mother_name: string;
    dob: Date;
}

export interface GradingScale {
    id: number;
    scale_name: string;
}

export interface GradeDefinition {
    id: number;
    grading_scale_id: number;
    grade_label: string;
    min_value?: number;
    max_value?: number;
    description?: string;
}

export interface AssessmentComponent {
    id: number;
    component_name: string;
}

// ... Add other interfaces as needed for API payloads
