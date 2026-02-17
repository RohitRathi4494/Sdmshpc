-- Step 3: Extend Student Schema
-- Run this to add new fields to the students table

ALTER TABLE students
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS student_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_no VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_no VARCHAR(20),
ADD COLUMN IF NOT EXISTS category VARCHAR(20),
ADD COLUMN IF NOT EXISTS ppp_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS apaar_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS aadhar_no VARCHAR(20),
ADD COLUMN IF NOT EXISTS board_roll_x VARCHAR(50),
ADD COLUMN IF NOT EXISTS board_roll_xii VARCHAR(50),
ADD COLUMN IF NOT EXISTS education_reg_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS srn_no VARCHAR(50);

-- Make student_code unique if populated, but for now allow nulls or duplicates until logic is fixed
-- CREATE UNIQUE INDEX idx_student_code ON students(student_code);
