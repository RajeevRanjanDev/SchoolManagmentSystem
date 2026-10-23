-- ============================================================
-- V10 : Academic Structure Extension
-- Extends existing class/section model for College, University,
-- Coaching, and Training institution types.
-- Existing school_classes and sections tables are UNTOUCHED.
-- ============================================================

-- 1. Academic programs (College / University)
CREATE TABLE academic_programs (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    department_id   BIGINT       REFERENCES employee_departments(id),
    name            VARCHAR(200) NOT NULL,       -- "B.Tech", "MBA", "M.Sc Physics"
    code            VARCHAR(30),
    degree_type     VARCHAR(50),                 -- DIPLOMA|BACHELORS|MASTERS|PHD|CERTIFICATE
    duration_years  INTEGER,
    total_semesters INTEGER,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_academic_programs_tenant ON academic_programs(tenant_id);

-- 2. Academic semesters / years within a program
CREATE TABLE academic_semesters (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    program_id      BIGINT       NOT NULL REFERENCES academic_programs(id),
    name            VARCHAR(100) NOT NULL,   -- "Semester 1", "Year 1"
    semester_number INTEGER      NOT NULL,
    academic_session VARCHAR(20),
    start_date      DATE,
    end_date        DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, program_id, semester_number, academic_session)
);

CREATE INDEX idx_academic_semesters_program ON academic_semesters(program_id);

-- 3. Batches (Coaching / Training)
CREATE TABLE academic_batches (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    name            VARCHAR(150) NOT NULL,       -- "JEE-2025-A", "Java Full Stack Batch 3"
    code            VARCHAR(30),
    course_name     VARCHAR(200),                -- "JEE Mains + Advanced", "Python Programming"
    batch_type      VARCHAR(30),                 -- REGULAR|WEEKEND|ONLINE|CRASH_COURSE
    start_date      DATE,
    end_date        DATE,
    capacity        INTEGER,
    enrolled_count  INTEGER      DEFAULT 0,
    timing          VARCHAR(100),                -- "Mon-Fri 6-8 PM"
    faculty_id      BIGINT       REFERENCES employees(id),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_academic_batches_tenant  ON academic_batches(tenant_id);
CREATE INDEX idx_academic_batches_active  ON academic_batches(tenant_id, is_active);

-- 4. Program-Subject mapping (College/University subjects per semester)
CREATE TABLE program_subjects (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    program_id      BIGINT       NOT NULL REFERENCES academic_programs(id),
    semester_id     BIGINT       REFERENCES academic_semesters(id),
    subject_id      BIGINT       NOT NULL REFERENCES subjects(id),
    subject_type    VARCHAR(20)  DEFAULT 'CORE',  -- CORE|ELECTIVE|LAB|PROJECT
    credit_hours    NUMERIC(4,1),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, program_id, semester_id, subject_id)
);

CREATE INDEX idx_prog_subjects_program ON program_subjects(program_id);

-- 5. Batch-Subject mapping (Coaching/Training)
CREATE TABLE batch_subjects (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    batch_id        BIGINT       NOT NULL REFERENCES academic_batches(id),
    subject_id      BIGINT       NOT NULL REFERENCES subjects(id),
    sort_order      INTEGER      DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (batch_id, subject_id)
);

CREATE INDEX idx_batch_subjects_batch ON batch_subjects(batch_id);

-- 6. Now wire employee_assignments FKs to new tables
ALTER TABLE employee_assignments
    ADD CONSTRAINT fk_emp_assign_program  FOREIGN KEY (program_id)  REFERENCES academic_programs(id),
    ADD CONSTRAINT fk_emp_assign_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id),
    ADD CONSTRAINT fk_emp_assign_batch    FOREIGN KEY (batch_id)    REFERENCES academic_batches(id);

-- 7. Wire student_academic_profiles (from admission module) to new tables
ALTER TABLE student_academic_profiles
    ADD COLUMN IF NOT EXISTS program_id  BIGINT REFERENCES academic_programs(id),
    ADD COLUMN IF NOT EXISTS semester_id BIGINT REFERENCES academic_semesters(id),
    ADD COLUMN IF NOT EXISTS batch_id    BIGINT REFERENCES academic_batches(id);
