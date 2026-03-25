-- Migration script to implement Multi-Tenancy

-- 1. Create Tenants Table
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  school_name VARCHAR(255) NOT NULL,
  school_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert Initial Tenants
INSERT INTO tenants (id, school_name, school_code, address) VALUES 
(1, 'S D Memorial Sr. Sec. School', 'SDMS', 'Default Local Address'),
(2, 'S D Heritage Pride School', 'SDHPS', 'Branch Address');

-- Reset sequence to allow auto-incrementing from 3
SELECT setval('tenants_id_seq', 2);

-- 3. Add Tenant ID to Core Tables
ALTER TABLE users ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
-- Update Users UNIQUE constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT uq_users_username_tenant UNIQUE (username, tenant_id);

ALTER TABLE students ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE students ADD CONSTRAINT fk_students_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
-- Update Students UNIQUE constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_admission_no_key;
ALTER TABLE students ADD CONSTRAINT uq_students_admission_tenant UNIQUE (admission_no, tenant_id);

ALTER TABLE classes ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE classes ADD CONSTRAINT fk_classes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE sections ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE sections ADD CONSTRAINT fk_sections_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE subjects ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE subjects ADD CONSTRAINT fk_subjects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE class_subjects ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE class_subjects ADD CONSTRAINT fk_class_subjects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE student_enrollments ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE student_enrollments ADD CONSTRAINT fk_se_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE scholastic_scores ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE scholastic_scores ADD CONSTRAINT fk_ss_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE co_scholastic_scores ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE co_scholastic_scores ADD CONSTRAINT fk_css_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE attendance_records ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE attendance_records ADD CONSTRAINT fk_ar_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE remarks ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE remarks ADD CONSTRAINT fk_remarks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

ALTER TABLE academic_years ADD COLUMN tenant_id INT DEFAULT 1;
ALTER TABLE academic_years ADD CONSTRAINT fk_ay_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Check if student_subjects exists and update it just in case
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_subjects') THEN
        ALTER TABLE student_subjects ADD COLUMN tenant_id INT DEFAULT 1;
        ALTER TABLE student_subjects ADD CONSTRAINT fk_student_subjects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
    END IF;
END $$;
