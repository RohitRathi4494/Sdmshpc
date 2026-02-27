// foundational-skills.ts
// Static config for all 6 domains of the Foundational Stage (Nursery / LKG / UKG) HPC.
// To add class-specific skill variants later, add a `classes` array to any skill.

export interface FoundationalSkill {
    key: string;       // unique key stored in DB skill_key column
    label: string;     // text shown in the card and teacher UI
}

export interface FoundationalSubSection {
    subLabel: string;  // sub-header row (e.g. "Listening Skills")
    skills: FoundationalSkill[];
}

export interface FoundationalDomain {
    key: string;        // stored in DB domain column
    label: string;      // display label
    currGoal: string;   // curricular goals text shown on print card
    sections: (FoundationalSkill | FoundationalSubSection)[];
}

// Type guard
export function isSubSection(s: FoundationalSkill | FoundationalSubSection): s is FoundationalSubSection {
    return (s as FoundationalSubSection).subLabel !== undefined;
}

export const FOUNDATIONAL_DOMAINS: FoundationalDomain[] = [
    {
        key: 'well_being',
        label: 'Well-Being and Physical Development',
        currGoal: 'To develop gross and fine motor skills, coordination, independence, healthy habits, and positive participation in play.',
        sections: [
            { key: 'wb_01', label: 'Demonstrates coordination and balance during physical activities' },
            { key: 'wb_02', label: 'Participates actively in outdoor play' },
            { key: 'wb_03', label: 'Demonstrates independence in routine tasks' },
            { key: 'wb_04', label: 'Maintains hygiene and healthy practices' },
            { key: 'wb_05', label: 'Performs paper folding, tearing, pasting, and clay work with ease' },
            { key: 'wb_06', label: 'Draws and writes independently' },
        ],
    },
    {
        key: 'socio_emotional',
        label: 'Socio-Emotional Development',
        currGoal: 'To nurture emotional awareness, responsibility, cooperation, and positive social behaviour.',
        sections: [
            { key: 'se_01', label: 'Expresses thoughts and feelings clearly' },
            { key: 'se_02', label: 'Listens attentively and follows directions' },
            { key: 'se_03', label: 'Accepts and fulfils responsibilities' },
            { key: 'se_04', label: 'Cooperates and shares with classmates' },
            { key: 'se_05', label: 'Participates actively in collaborative activities' },
        ],
    },
    {
        key: 'aesthetic',
        label: 'Aesthetic and Cultural Development',
        currGoal: 'To encourage creativity, rhythm awareness, and artistic expression through art, music, and movement.',
        sections: [
            { key: 'ae_01', label: 'Shows imaginative and creative expression in art' },
            { key: 'ae_02', label: 'Responds to rhythm and dances confidently' },
            { key: 'ae_03', label: 'Sings tunefully' },
        ],
    },
    {
        key: 'language_english',
        label: 'Language and Literacy — English (L1)',
        currGoal: 'To develop listening, speaking, reading, and writing skills for effective communication.',
        sections: [
            {
                subLabel: 'Listening Skills',
                skills: [
                    { key: 'en_ls_01', label: 'Pays attention and listens carefully' },
                    { key: 'en_ls_02', label: 'Demonstrates understanding of stories' },
                ],
            },
            {
                subLabel: 'Verbal Skills',
                skills: [
                    { key: 'en_vs_01', label: 'Uses vocabulary in meaningful conversations' },
                    { key: 'en_vs_02', label: 'Expresses ideas clearly' },
                ],
            },
            {
                subLabel: 'Reading Skills',
                skills: [
                    { key: 'en_rs_01', label: 'Identifies rhyming words' },
                    { key: 'en_rs_02', label: 'Blends sounds to read words' },
                    { key: 'en_rs_03', label: 'Reads selected sight words' },
                ],
            },
            {
                subLabel: 'Writing Skills',
                skills: [
                    { key: 'en_ws_01', label: 'Attempts phonetic spelling' },
                    { key: 'en_ws_02', label: 'Writes simple words' },
                ],
            },
        ],
    },
    {
        key: 'language_hindi',
        label: 'भाषा और साक्षरता — हिंदी',
        currGoal: 'सुनने, बोलने, पढ़ने और लिखने के कौशल को विकसित करना।',
        sections: [
            {
                subLabel: 'श्रवण कौशल',
                skills: [
                    { key: 'hi_ls_01', label: 'समझना और प्रतिक्रिया देना' },
                    { key: 'hi_ls_02', label: 'कहानी को समझने का प्रयास' },
                ],
            },
            {
                subLabel: 'मौखिक कौशल',
                skills: [
                    { key: 'hi_vs_01', label: 'शब्दावली का उचित प्रयोग' },
                    { key: 'hi_vs_02', label: 'सही उच्चारण' },
                ],
            },
            {
                subLabel: 'पठन कौशल',
                skills: [
                    { key: 'hi_rs_01', label: 'अक्षरों की पहचान' },
                    { key: 'hi_rs_02', label: 'ध्वनि को अक्षर से जोड़ना' },
                ],
            },
            {
                subLabel: 'लेखन कौशल',
                skills: [
                    { key: 'hi_ws_01', label: 'अक्षरों की सही बनावट' },
                    { key: 'hi_ws_02', label: 'साधारण शब्द लिखना' },
                ],
            },
        ],
    },
    {
        key: 'cognitive',
        label: 'Cognitive Development',
        currGoal: 'To build foundational numeracy, inquiry, problem-solving, and early technology skills.',
        sections: [
            { key: 'cog_01', label: 'Understands number value' },
            { key: 'cog_02', label: 'Explores and applies basic concepts' },
            { key: 'cog_03', label: 'Shows curiosity and connects learning to real life' },
            { key: 'cog_04', label: 'Observes and assimilates new concepts' },
            { key: 'cog_05', label: 'Demonstrates good mouse control' },
            { key: 'cog_06', label: 'Expresses ideas clearly' },
            { key: 'cog_07', label: 'Uses the keyboard appropriately' },
        ],
    },
    {
        key: 'learning_habits',
        label: 'Positive Learning Habits',
        currGoal: 'To develop focus, responsibility, respect, and independence for lifelong learning.',
        sections: [
            { key: 'lh_01', label: 'Follows class routines' },
            { key: 'lh_02', label: 'Respects others and follows basic etiquettes' },
            { key: 'lh_03', label: 'Takes turns and shares with peers' },
            { key: 'lh_04', label: 'Concentrates on assigned tasks' },
            { key: 'lh_05', label: 'Maintains neatness of materials and workspace' },
        ],
    },
];

// General Info prompts (text fields for Attendance, Best Friend, Health, etc)
export const GENERAL_INFO_FIELDS = [
    { key: 'gi_attendance', label: 'Attendance (Days Present / Total Days)' },
    { key: 'gi_height', label: 'Height (cm)' },
    { key: 'gi_weight', label: 'Weight (kg)' },
    { key: 'gi_blood_group', label: 'Blood Group' },
    { key: 'gi_best_friend', label: 'My Best Friend' }
];

// Self-Assessment prompts (text fields)
export const SELF_ASSESS_FIELDS = [
    { key: 'sa_01', label: '1. Activities that I enjoy the most' },
    { key: 'sa_02', label: '2. Activities that I find difficult to do' },
    { key: 'sa_03', label: '3. Activities that I enjoy doing with my friends' },
];

// Parent feedback text fields
export const PARENT_FEEDBACK_FIELDS = [
    { key: 'pf_01', label: 'My child enjoys participating in…' },
    { key: 'pf_02', label: 'My child can be supported for…' },
    { key: 'pf_03', label: 'I would also like to share…' },
    { key: 'pf_04', label: 'Have I completed age-appropriate vaccination schedule for my child?' },
];

// Foundational classes — used to detect which students get HPC entry
export const FOUNDATIONAL_CLASS_NAMES = ['nursery', 'lkg', 'ukg', 'pre-kg', 'pre kg', 'kg1', 'kg2'];

export function isFoundationalClass(className: string): boolean {
    return FOUNDATIONAL_CLASS_NAMES.some(n => className.trim().toLowerCase().includes(n));
}

// Rating display helpers
export const RATINGS = [
    { value: 'A', label: 'A', stars: '★★★', color: '#1a7a3b', light: '#ecfdf5', meaning: 'Advanced' },
    { value: 'B', label: 'B', stars: '★★', color: '#2563EB', light: '#eff6ff', meaning: 'Age Appropriate' },
    { value: 'C', label: 'C', stars: '★', color: '#d97706', light: '#fffbeb', meaning: 'Getting There' },
] as const;

export type Rating = 'A' | 'B' | 'C' | '';
