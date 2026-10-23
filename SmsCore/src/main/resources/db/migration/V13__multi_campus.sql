-- ============================================================
-- V13 : Multi-Campus Support
-- Extends the tenant model: 1 tenant (school) → N campuses.
-- campus_id is nullable — existing single-campus tenants
-- continue to work with campus_id = NULL (means "main campus").
-- ============================================================

-- 1. Campus master table
CREATE TABLE campuses (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT       NOT NULL REFERENCES schools(id),
    name                VARCHAR(200) NOT NULL,
    code                VARCHAR(30)  NOT NULL,
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(80)  DEFAULT 'India',
    pincode             VARCHAR(10),
    phone               VARCHAR(20),
    email               VARCHAR(150),
    principal_name      VARCHAR(200),
    logo_url            TEXT,
    is_main_campus      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Inherited institution type (may differ from tenant for multi-type groups)
    institution_type    VARCHAR(30),
    -- Academic config per campus
    current_academic_year VARCHAR(20),
    timezone            VARCHAR(50)  DEFAULT 'Asia/Kolkata',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    is_deleted          BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_campuses_tenant  ON campuses(tenant_id);
CREATE INDEX idx_campuses_active  ON campuses(tenant_id, is_active);

-- 2. Add campus_id to all operational tables (nullable — backward compatible)
--    Existing rows will have campus_id = NULL → interpreted as "main campus"

ALTER TABLE school_classes        ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE sections              ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE employees             ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE student_profiles      ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE fees                  ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE attendance            ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE employee_attendance   ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE academic_batches      ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE academic_programs     ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);
ALTER TABLE employee_assignments  ADD COLUMN IF NOT EXISTS campus_id BIGINT REFERENCES campuses(id);

-- 3. Index campus_id on the high-volume tables
CREATE INDEX idx_school_classes_campus  ON school_classes(campus_id) WHERE campus_id IS NOT NULL;
CREATE INDEX idx_employees_campus       ON employees(campus_id)      WHERE campus_id IS NOT NULL;
CREATE INDEX idx_student_campus         ON student_profiles(campus_id) WHERE campus_id IS NOT NULL;

-- 4. Campus admin user mapping
--    A user can be campus-scoped (campus_id set) or tenant-scoped (campus_id = NULL = sees all)
CREATE TABLE user_campus_scope (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES schools(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    campus_id       BIGINT NOT NULL REFERENCES campuses(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, user_id, campus_id)
);

CREATE INDEX idx_user_campus_scope_user ON user_campus_scope(user_id);

-- 5. Cross-campus transfer log
CREATE TABLE campus_transfer_log (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT       NOT NULL REFERENCES schools(id),
    entity_type         VARCHAR(20)  NOT NULL,   -- STUDENT | EMPLOYEE
    entity_id           BIGINT       NOT NULL,
    from_campus_id      BIGINT       NOT NULL REFERENCES campuses(id),
    to_campus_id        BIGINT       NOT NULL REFERENCES campuses(id),
    transfer_date       DATE         NOT NULL,
    reason              TEXT,
    approved_by         VARCHAR(100),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    is_deleted          BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_campus_transfer_entity ON campus_transfer_log(entity_type, entity_id);

-- 6. Add CAMPUS_ADMIN role to all template_roles
INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT id, 'CAMPUS_ADMIN', 'Campus Administrator', FALSE, 2
FROM institution_templates
WHERE institution_type IN ('SCHOOL','COLLEGE','UNIVERSITY','COACHING_INSTITUTE','TRAINING_INSTITUTE')
ON CONFLICT DO NOTHING;
