-- ============================================================
-- V9 : Unified Employee Module
-- Replaces school-specific Teacher entity for new tenants.
-- Existing teachers table is PRESERVED for backward compat.
-- New tenants use employees table exclusively.
-- ============================================================

-- 1. Departments (per tenant)
CREATE TABLE employee_departments (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(30),
    head_employee_id BIGINT,          -- FK set after employee insert via ALTER
    description     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_emp_dept_tenant ON employee_departments(tenant_id);

-- 2. Designations (per tenant)
CREATE TABLE employee_designations (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(30),
    grade_level     INTEGER,          -- pay grade / band
    department_id   BIGINT       REFERENCES employee_departments(id),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_emp_desig_tenant ON employee_designations(tenant_id);

-- 3. Master employee table (unified across all institution types)
CREATE TABLE employees (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT       NOT NULL REFERENCES schools(id),
    employee_code       VARCHAR(30)  NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    middle_name         VARCHAR(100),
    last_name           VARCHAR(100) NOT NULL,
    gender              VARCHAR(10),
    date_of_birth       DATE,
    blood_group         VARCHAR(5),
    nationality         VARCHAR(50)  DEFAULT 'Indian',
    aadhaar_number      VARCHAR(12),
    pan_number          VARCHAR(10),
    mobile              VARCHAR(15),
    alternate_mobile    VARCHAR(15),
    email               VARCHAR(150),
    official_email      VARCHAR(150),
    profile_photo_url   TEXT,
    -- Employment details
    designation_id      BIGINT       REFERENCES employee_designations(id),
    department_id       BIGINT       REFERENCES employee_departments(id),
    reporting_manager_id BIGINT      REFERENCES employees(id),
    employee_type       VARCHAR(30)  NOT NULL DEFAULT 'FULL_TIME', -- FULL_TIME|PART_TIME|CONTRACT|VISITING|INTERN
    employment_status   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE|ON_LEAVE|RESIGNED|TERMINATED|RETIRED
    joining_date        DATE,
    confirmation_date   DATE,
    resignation_date    DATE,
    last_working_date   DATE,
    -- User account link
    user_id             BIGINT       REFERENCES users(id),
    -- Address
    current_address     TEXT,
    permanent_address   TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    -- Bank details (encrypted at app layer)
    bank_name           VARCHAR(100),
    bank_account_number VARCHAR(50),
    ifsc_code           VARCHAR(15),
    -- System
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    is_deleted          BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, employee_code),
    UNIQUE (tenant_id, aadhaar_number),
    UNIQUE (tenant_id, official_email)
);

CREATE INDEX idx_employees_tenant         ON employees(tenant_id);
CREATE INDEX idx_employees_status         ON employees(tenant_id, employment_status);
CREATE INDEX idx_employees_department     ON employees(department_id);
CREATE INDEX idx_employees_designation    ON employees(designation_id);
CREATE INDEX idx_employees_user           ON employees(user_id);

-- FK: department head (circular ref — deferred)
ALTER TABLE employee_departments
    ADD CONSTRAINT fk_dept_head
    FOREIGN KEY (head_employee_id) REFERENCES employees(id) DEFERRABLE INITIALLY DEFERRED;

-- 4. Academic assignments (replaces teacher_assignments for new tenants)
CREATE TABLE employee_assignments (
    id               BIGSERIAL PRIMARY KEY,
    tenant_id        BIGINT       NOT NULL REFERENCES schools(id),
    employee_id      BIGINT       NOT NULL REFERENCES employees(id),
    assignment_type  VARCHAR(30)  NOT NULL, -- CLASS_SECTION|PROGRAM_SEMESTER|BATCH_COURSE|ADMIN|COORDINATOR
    -- School: class + section + subject
    class_id         BIGINT       REFERENCES school_classes(id),
    section_id       BIGINT       REFERENCES sections(id),
    -- College/University: program + semester + subject
    program_id       BIGINT,       -- FK to academic_programs (added in V10)
    semester_id      BIGINT,       -- FK to academic_semesters (added in V10)
    department_id    BIGINT       REFERENCES employee_departments(id),
    -- Coaching/Training: batch + subject
    batch_id         BIGINT,       -- FK to academic_batches (added in V10)
    -- Shared
    subject_id       BIGINT       REFERENCES subjects(id),
    academic_session VARCHAR(20),
    is_class_teacher BOOLEAN      DEFAULT FALSE,
    start_date       DATE,
    end_date         DATE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_emp_assign_employee   ON employee_assignments(employee_id);
CREATE INDEX idx_emp_assign_tenant     ON employee_assignments(tenant_id);
CREATE INDEX idx_emp_assign_class      ON employee_assignments(class_id, section_id);

-- 5. Employee documents
CREATE TABLE employee_documents (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    employee_id     BIGINT       NOT NULL REFERENCES employees(id),
    document_type   VARCHAR(50)  NOT NULL,  -- AADHAAR|PAN|RESUME|DEGREE|EXPERIENCE|APPOINTMENT|OTHER
    file_url        TEXT         NOT NULL,
    file_name       VARCHAR(255),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING|VERIFIED|REJECTED
    verified_by     VARCHAR(100),
    verified_at     TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_emp_docs_employee ON employee_documents(employee_id);

-- 6. Employee qualifications
CREATE TABLE employee_qualifications (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    employee_id     BIGINT       NOT NULL REFERENCES employees(id),
    degree          VARCHAR(150) NOT NULL,
    field_of_study  VARCHAR(150),
    institution     VARCHAR(200),
    board_university VARCHAR(200),
    passing_year    INTEGER,
    percentage      NUMERIC(5,2),
    grade           VARCHAR(10),
    is_highest      BOOLEAN      DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_emp_qual_employee ON employee_qualifications(employee_id);

-- 7. Employee salary structures
CREATE TABLE employee_salary_structures (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           BIGINT         NOT NULL REFERENCES schools(id),
    employee_id         BIGINT         NOT NULL REFERENCES employees(id),
    effective_from      DATE           NOT NULL,
    effective_to        DATE,
    basic_salary        NUMERIC(12,2)  NOT NULL,
    hra                 NUMERIC(12,2)  DEFAULT 0,
    da                  NUMERIC(12,2)  DEFAULT 0,
    ta                  NUMERIC(12,2)  DEFAULT 0,
    special_allowance   NUMERIC(12,2)  DEFAULT 0,
    gross_salary        NUMERIC(12,2)  NOT NULL,
    pf_deduction        NUMERIC(12,2)  DEFAULT 0,
    pt_deduction        NUMERIC(12,2)  DEFAULT 0,
    tds_deduction       NUMERIC(12,2)  DEFAULT 0,
    net_salary          NUMERIC(12,2)  NOT NULL,
    is_active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    is_deleted          BOOLEAN        NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_emp_salary_employee ON employee_salary_structures(employee_id);
CREATE INDEX idx_emp_salary_active   ON employee_salary_structures(employee_id, is_active);

-- 8. Employee attendance
CREATE TABLE employee_attendance (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    employee_id     BIGINT       NOT NULL REFERENCES employees(id),
    attendance_date DATE         NOT NULL,
    status          VARCHAR(20)  NOT NULL,  -- PRESENT|ABSENT|HALF_DAY|ON_LEAVE|HOLIDAY|WORK_FROM_HOME
    check_in_time   TIME,
    check_out_time  TIME,
    working_hours   NUMERIC(4,2),
    remarks         VARCHAR(300),
    marked_by       VARCHAR(100),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, employee_id, attendance_date)
);

CREATE INDEX idx_emp_att_employee_date ON employee_attendance(employee_id, attendance_date);
CREATE INDEX idx_emp_att_tenant_date   ON employee_attendance(tenant_id, attendance_date);

-- 9. Employee leave requests
CREATE TABLE employee_leave_requests (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    employee_id     BIGINT       NOT NULL REFERENCES employees(id),
    leave_type      VARCHAR(30)  NOT NULL,   -- CASUAL|SICK|EARNED|MATERNITY|PATERNITY|COMP_OFF
    from_date       DATE         NOT NULL,
    to_date         DATE         NOT NULL,
    total_days      NUMERIC(4,1) NOT NULL,
    reason          TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|CANCELLED
    approved_by     BIGINT       REFERENCES employees(id),
    approved_at     TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_emp_leave_employee ON employee_leave_requests(employee_id);
CREATE INDEX idx_emp_leave_status   ON employee_leave_requests(tenant_id, status);
