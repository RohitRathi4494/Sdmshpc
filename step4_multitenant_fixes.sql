-- Patch missing tables with tenant_id for multi-tenancy isolation
-- Covers locks, audits, and foundational grading

-- 1. Assessment Locks
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_locks') THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assessment_locks' and column_name='tenant_id') THEN
            ALTER TABLE assessment_locks ADD COLUMN tenant_id INT DEFAULT 1;
            ALTER TABLE assessment_locks ADD CONSTRAINT fk_al_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
        END IF;
    END IF;
END $$;

-- 2. Assessment Locks Audit
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_locks_audit') THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='assessment_locks_audit' and column_name='tenant_id') THEN
            ALTER TABLE assessment_locks_audit ADD COLUMN tenant_id INT DEFAULT 1;
            ALTER TABLE assessment_locks_audit ADD CONSTRAINT fk_ala_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
        END IF;
    END IF;
END $$;

-- 3. Foundational Text Fields
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'foundational_text_fields') THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='foundational_text_fields' and column_name='tenant_id') THEN
            ALTER TABLE foundational_text_fields ADD COLUMN tenant_id INT DEFAULT 1;
            ALTER TABLE foundational_text_fields ADD CONSTRAINT fk_ftf_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
        END IF;
    END IF;
END $$;

-- 4. Foundational Skill Ratings
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'foundational_skill_ratings') THEN
        IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='foundational_skill_ratings' and column_name='tenant_id') THEN
            ALTER TABLE foundational_skill_ratings ADD COLUMN tenant_id INT DEFAULT 1;
            ALTER TABLE foundational_skill_ratings ADD CONSTRAINT fk_fsr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
        END IF;
    END IF;
END $$;
