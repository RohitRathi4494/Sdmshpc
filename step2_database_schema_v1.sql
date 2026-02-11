-- Database Creation
-- CREATE DATABASE school_erp_hpc;
-- Connect to database before running the script if using psql: \c school_erp_hpc

-- 0. Master Tables (Created first for FK references)
CREATE TABLE terms (
  id SERIAL PRIMARY KEY,
  term_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE remark_types (
  id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE months (
  id SERIAL PRIMARY KEY,
  month_name VARCHAR(20) NOT NULL UNIQUE,
  display_order INT NOT NULL
);

CREATE TABLE grading_scales (
  id SERIAL PRIMARY KEY,
  scale_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE assessment_components (
  id SERIAL PRIMARY KEY,
  component_name VARCHAR(100) NOT NULL UNIQUE
);

-- 1. Academic Setup
CREATE TABLE academic_years (
  id SERIAL PRIMARY KEY,
  year_name VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(20) NOT NULL,
  display_order INT NOT NULL
);

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  class_id INT NOT NULL,
  section_name VARCHAR(10) NOT NULL,
  class_teacher_id INT,
  CONSTRAINT fk_sections_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_sections_teacher FOREIGN KEY (class_teacher_id) REFERENCES users(id)
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL
);

CREATE TABLE class_subjects (
  id SERIAL PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_cs_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_cs_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_cs_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- 2. Student Core
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  admission_no VARCHAR(50) UNIQUE NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255) NOT NULL,
  mother_name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL
);

CREATE TABLE student_enrollments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  roll_no INT,
  CONSTRAINT fk_se_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_se_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_se_section FOREIGN KEY (section_id) REFERENCES sections(id),
  CONSTRAINT fk_se_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- 3. Scholastic Assessment
CREATE TABLE scholastic_scores (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  component_id INT NOT NULL,
  term_id INT NOT NULL, -- Replaced VARCHAR with FK
  grade VARCHAR(5) NOT NULL,
  marks NUMERIC(5,2),
  academic_year_id INT NOT NULL,
  CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_ss_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_ss_component FOREIGN KEY (component_id) REFERENCES assessment_components(id),
  CONSTRAINT fk_ss_term FOREIGN KEY (term_id) REFERENCES terms(id),
  CONSTRAINT fk_ss_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT uq_scholastic_score UNIQUE (student_id, subject_id, component_id, term_id, academic_year_id)
);

-- 4. Co-Scholastic & Personality
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  domain_name VARCHAR(100) NOT NULL,
  domain_type VARCHAR(50) NOT NULL, -- 'co_scholastic' or 'personality'
  grading_scale_id INT NOT NULL, -- Replaced VARCHAR with FK
  CONSTRAINT fk_dom_scale FOREIGN KEY (grading_scale_id) REFERENCES grading_scales(id)
);

CREATE TABLE sub_skills (
  id SERIAL PRIMARY KEY,
  domain_id INT NOT NULL,
  sub_skill_name VARCHAR(255) NOT NULL,
  CONSTRAINT fk_ss_domain FOREIGN KEY (domain_id) REFERENCES domains(id)
);

CREATE TABLE co_scholastic_scores (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  sub_skill_id INT NOT NULL,
  term_id INT NOT NULL, -- Replaced VARCHAR with FK
  grade VARCHAR(5) NOT NULL,
  academic_year_id INT NOT NULL,
  CONSTRAINT fk_css_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_css_sub_skill FOREIGN KEY (sub_skill_id) REFERENCES sub_skills(id),
  CONSTRAINT fk_css_term FOREIGN KEY (term_id) REFERENCES terms(id),
  CONSTRAINT fk_css_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT uq_co_scholastic_score UNIQUE (student_id, sub_skill_id, term_id, academic_year_id)
);

-- 5. Attendance
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  month_id INT NOT NULL, -- Replaced VARCHAR with FK
  working_days INT NOT NULL,
  days_present INT NOT NULL,
  academic_year_id INT NOT NULL,
  CONSTRAINT fk_ar_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_ar_month FOREIGN KEY (month_id) REFERENCES months(id),
  CONSTRAINT fk_ar_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT uq_attendance UNIQUE (student_id, month_id, academic_year_id)
);

-- 6. Remarks & Narratives
CREATE TABLE remarks (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  remark_type_id INT NOT NULL, -- Replaced VARCHAR with FK
  aspect VARCHAR(255),
  remark_text TEXT NOT NULL,
  academic_year_id INT NOT NULL,
  CONSTRAINT fk_rem_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_rem_type FOREIGN KEY (remark_type_id) REFERENCES remark_types(id),
  CONSTRAINT fk_rem_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- 7. Grading Framework Definitions
CREATE TABLE grade_definitions (
  id SERIAL PRIMARY KEY,
  grading_scale_id INT NOT NULL,
  grade_label VARCHAR(10) NOT NULL,
  min_value NUMERIC(5,2),
  max_value NUMERIC(5,2),
  description TEXT,
  CONSTRAINT fk_gd_scale FOREIGN KEY (grading_scale_id) REFERENCES grading_scales(id)
);

-- SEED DATA

-- Terms
INSERT INTO terms (term_name) VALUES ('Term I'), ('Term II');

-- Remark Types
INSERT INTO remark_types (type_name) VALUES 
('Learner’s Profile by the teacher'), 
('Parent’s Feedback'), 
('Self-Assessment');

-- Months
INSERT INTO months (display_order, month_name) VALUES 
(1, 'Apr'), (2, 'May'), (3, 'Jun'), (4, 'Jul'), (5, 'Aug'), (6, 'Sep'), 
(7, 'Oct'), (8, 'Nov'), (9, 'Dec'), (10, 'Jan'), (11, 'Feb'), (12, 'Mar');

-- Assessment Components
INSERT INTO assessment_components (component_name) VALUES
('Periodic Assessment'),
('Subject Enrichment Activities'),
('Internal Assessment'),
('Terminal Assessment');

-- Grading Scales
INSERT INTO grading_scales (scale_name) VALUES
('scholastic_grade'),
('co_scholastic_scale'),
('physical_education_scale');

-- Grade Definitions
-- 1. Scholastic Grade
INSERT INTO grade_definitions (grading_scale_id, grade_label, min_value, max_value, description)
SELECT id, 'A1', 91, 100, 'Consistently produces high-quality, innovative work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'A2', 81, 90, 'Produces high-quality work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'B1', 71, 80, 'Produces generally high-quality work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'B2', 61, 70, 'Produces good quality work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'C1', 51, 60, 'Produces acceptable work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'C2', 41, 50, 'Produces limited quality work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'D', 33, 40, 'Produces very limited work...' FROM grading_scales WHERE scale_name = 'scholastic_grade'
UNION ALL
SELECT id, 'E', 0, 33, 'Not yet assessed / Needs improvement' FROM grading_scales WHERE scale_name = 'scholastic_grade';

-- 2. Co-Scholastic Scale
INSERT INTO grade_definitions (grading_scale_id, grade_label, description)
SELECT id, 'A', 'Demonstrates clear understanding of the skill and applies it independently with confidence.' FROM grading_scales WHERE scale_name = 'co_scholastic_scale'
UNION ALL
SELECT id, 'B', 'Demonstrates understanding of the skill but requires time and guidance for consistent performance.' FROM grading_scales WHERE scale_name = 'co_scholastic_scale'
UNION ALL
SELECT id, 'C', 'Requires support to understand and apply the skill effectively.' FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

-- 3. Physical Education Scale
INSERT INTO grade_definitions (grading_scale_id, grade_label, description)
SELECT id, 'A', 'Actively and effectively participates in activities involving agility, balance, coordination, speed and strength.' FROM grading_scales WHERE scale_name = 'physical_education_scale'
UNION ALL
SELECT id, 'B', 'Participates adequately in physical activities with moderate proficiency.' FROM grading_scales WHERE scale_name = 'physical_education_scale'
UNION ALL
SELECT id, 'C', 'Requires support and encouragement to participate effectively in physical activities.' FROM grading_scales WHERE scale_name = 'physical_education_scale';

-- Domains & Sub-Skills (Strict JSON Matching)

-- Physical Education
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Physical Education', 'co_scholastic', id FROM grading_scales WHERE scale_name = 'physical_education_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Physical Fitness' FROM domains WHERE domain_name = 'Physical Education'
UNION ALL
SELECT id, 'Muscular Strength' FROM domains WHERE domain_name = 'Physical Education'
UNION ALL
SELECT id, 'Agility & Balance' FROM domains WHERE domain_name = 'Physical Education'
UNION ALL
SELECT id, 'Stamina' FROM domains WHERE domain_name = 'Physical Education';

-- Visual Art
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Visual Art', 'co_scholastic', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Creative Expression' FROM domains WHERE domain_name = 'Visual Art'
UNION ALL
SELECT id, 'Fine Motor Skills' FROM domains WHERE domain_name = 'Visual Art'
UNION ALL
SELECT id, 'Reflecting, Responding and Analyzing' FROM domains WHERE domain_name = 'Visual Art'
UNION ALL
SELECT id, 'Use of Technique' FROM domains WHERE domain_name = 'Visual Art';

-- Performing Art - Dance
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Performing Art - Dance', 'co_scholastic', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Posture' FROM domains WHERE domain_name = 'Performing Art - Dance'
UNION ALL
SELECT id, 'Expression' FROM domains WHERE domain_name = 'Performing Art - Dance'
UNION ALL
SELECT id, 'Rhythm' FROM domains WHERE domain_name = 'Performing Art - Dance'
UNION ALL
SELECT id, 'Overall Performance' FROM domains WHERE domain_name = 'Performing Art - Dance';

-- Performing Art - Music
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Performing Art - Music', 'co_scholastic', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Rhythm' FROM domains WHERE domain_name = 'Performing Art - Music'
UNION ALL
SELECT id, 'Pitch' FROM domains WHERE domain_name = 'Performing Art - Music'
UNION ALL
SELECT id, 'Melody (Sings in Tune)' FROM domains WHERE domain_name = 'Performing Art - Music'
UNION ALL
SELECT id, 'Overall Performance' FROM domains WHERE domain_name = 'Performing Art - Music';

-- Personality Development (Social Skills, Emotional Skill, Work Habit, Health & Wellness)
-- Social Skills
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Social Skills', 'personality', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Maintains cordial relationship with peers and adults' FROM domains WHERE domain_name = 'Social Skills'
UNION ALL
SELECT id, 'Demonstrates teamwork and cooperation' FROM domains WHERE domain_name = 'Social Skills'
UNION ALL
SELECT id, 'Respects school property and personal belongings' FROM domains WHERE domain_name = 'Social Skills';

-- Emotional Skill
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Emotional Skill', 'personality', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Shows sensitivity towards rules and norms' FROM domains WHERE domain_name = 'Emotional Skill'
UNION ALL
SELECT id, 'Demonstrates self-regulation of emotions and behaviour' FROM domains WHERE domain_name = 'Emotional Skill'
UNION ALL
SELECT id, 'Displays empathy and concern for others' FROM domains WHERE domain_name = 'Emotional Skill';

-- Work Habit
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Work Habit', 'personality', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Maintains regularity and punctuality' FROM domains WHERE domain_name = 'Work Habit'
UNION ALL
SELECT id, 'Demonstrates responsible citizenship' FROM domains WHERE domain_name = 'Work Habit'
UNION ALL
SELECT id, 'Shows care and concern for the environment' FROM domains WHERE domain_name = 'Work Habit';

-- Health & Wellness
INSERT INTO domains (domain_name, domain_type, grading_scale_id) 
SELECT 'Health & Wellness', 'personality', id FROM grading_scales WHERE scale_name = 'co_scholastic_scale';

INSERT INTO sub_skills (domain_id, sub_skill_name)
SELECT id, 'Follows good hygiene practices' FROM domains WHERE domain_name = 'Health & Wellness'
UNION ALL
SELECT id, 'Maintains cleanliness of self and surroundings' FROM domains WHERE domain_name = 'Health & Wellness'
UNION ALL
SELECT id, 'Demonstrates resilience and positive coping skills' FROM domains WHERE domain_name = 'Health & Wellness';
