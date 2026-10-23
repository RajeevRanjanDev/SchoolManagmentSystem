-- ============================================================
-- V7: Student Admission & Registration Module
-- Multi-tenant, enterprise-grade
-- ============================================================

-- ── student_profiles ─────────────────────────────────────────
CREATE TABLE student_profiles (
    id                    BIGSERIAL PRIMARY KEY,
    tenant_id             BIGINT       NOT NULL REFERENCES schools(id),
    school_id             BIGINT       NOT NULL REFERENCES schools(id),

    -- Identity
    student_code          VARCHAR(30)  NOT NULL,
    admission_number      VARCHAR(50),
    enrollment_number     VARCHAR(50),

    -- Personal
    first_name            VARCHAR(100) NOT NULL,
    middle_name           VARCHAR(100),
    last_name             VARCHAR(100) NOT NULL,
    gender                VARCHAR(10),
    date_of_birth         DATE,
    blood_group           VARCHAR(5),
    category              VARCHAR(30),  -- SC/ST/OBC/GEN/EWS
    nationality           VARCHAR(60)  DEFAULT 'Indian',
    religion              VARCHAR(60),
    mother_tongue         VARCHAR(60),
    aadhaar_number        VARCHAR(12),
    mobile                VARCHAR(15),
    email                 VARCHAR(150),
    profile_photo_url     TEXT,

    -- Lifecycle
    lifecycle_status      VARCHAR(30)  NOT NULL DEFAULT 'APPLICANT',
    admission_date        DATE,
    admission_type        VARCHAR(30),
    previous_institution  VARCHAR(200),
    previous_qualification VARCHAR(200),

    -- Audit
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100),
    is_deleted            BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_sp_admission_per_tenant  UNIQUE (tenant_id, admission_number),
    CONSTRAINT uq_sp_enrollment_per_tenant UNIQUE (tenant_id, enrollment_number),
    CONSTRAINT uq_sp_student_code_per_tenant UNIQUE (tenant_id, student_code)
);

CREATE INDEX idx_sp_tenant        ON student_profiles(tenant_id);
CREATE INDEX idx_sp_status        ON student_profiles(lifecycle_status);
CREATE INDEX idx_sp_aadhaar       ON student_profiles(aadhaar_number);
CREATE INDEX idx_sp_mobile        ON student_profiles(mobile);
CREATE INDEX idx_sp_name          ON student_profiles(tenant_id, last_name, first_name);

-- ── student_academic_profiles ────────────────────────────────
CREATE TABLE student_academic_profiles (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id               BIGINT      NOT NULL,
    student_profile_id      BIGINT      NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    institution_type        VARCHAR(30) NOT NULL,
    academic_session        VARCHAR(20),

    -- School
    class_id                BIGINT,
    class_name              VARCHAR(50),
    section_id              BIGINT,
    section_name            VARCHAR(20),
    roll_number             VARCHAR(20),

    -- College / University
    program                 VARCHAR(100),
    course                  VARCHAR(100),
    department              VARCHAR(100),
    branch                  VARCHAR(100),
    semester                INT,
    year_of_study           INT,
    registration_number     VARCHAR(50),
    university_roll_number  VARCHAR(50),

    -- Coaching / Training
    batch_id                BIGINT,
    batch_name              VARCHAR(100),
    batch_start_date        DATE,
    batch_end_date          DATE,

    created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),
    is_deleted              BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sap_tenant   ON student_academic_profiles(tenant_id);
CREATE INDEX idx_sap_session  ON student_academic_profiles(tenant_id, academic_session);
CREATE INDEX idx_sap_class    ON student_academic_profiles(class_id);
CREATE INDEX idx_sap_batch    ON student_academic_profiles(batch_id);

-- ── student_guardians ────────────────────────────────────────
CREATE TABLE student_guardians (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    relation           VARCHAR(20) NOT NULL,
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100),
    mobile             VARCHAR(15),
    email              VARCHAR(150),
    occupation         VARCHAR(100),
    annual_income      NUMERIC(12,2),
    qualification      VARCHAR(100),
    aadhaar_number     VARCHAR(12),
    is_primary         BOOLEAN     NOT NULL DEFAULT FALSE,
    has_portal_access  BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sg_tenant  ON student_guardians(tenant_id);
CREATE INDEX idx_sg_student ON student_guardians(student_profile_id);
CREATE INDEX idx_sg_mobile  ON student_guardians(mobile);

-- ── student_addresses ────────────────────────────────────────
CREATE TABLE student_addresses (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    address_type       VARCHAR(15) NOT NULL,   -- CURRENT | PERMANENT
    address_line1      VARCHAR(255),
    address_line2      VARCHAR(255),
    city               VARCHAR(100),
    state              VARCHAR(100),
    country            VARCHAR(80)  DEFAULT 'India',
    pincode            VARCHAR(10),

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sa_tenant  ON student_addresses(tenant_id);
CREATE INDEX idx_sa_student ON student_addresses(student_profile_id);
CREATE INDEX idx_sa_pincode ON student_addresses(pincode);

-- ── student_medical_details ──────────────────────────────────
CREATE TABLE student_medical_details (
    id                      BIGSERIAL PRIMARY KEY,
    tenant_id               BIGINT NOT NULL,
    student_profile_id      BIGINT NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    blood_group             VARCHAR(5),
    medical_conditions      TEXT,
    allergies               TEXT,
    disability_type         VARCHAR(100),
    disability_details      TEXT,
    disability_percentage   INT,
    emergency_medical_notes TEXT,
    family_doctor_name      VARCHAR(150),
    family_doctor_mobile    VARCHAR(15),

    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),
    is_deleted              BOOLEAN   NOT NULL DEFAULT FALSE
);

-- ── student_transport_details ────────────────────────────────
CREATE TABLE student_transport_details (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    transport_required BOOLEAN     NOT NULL DEFAULT FALSE,
    route_id           BIGINT,
    route_name         VARCHAR(100),
    stop_name          VARCHAR(100),
    pickup_point       VARCHAR(200),
    transport_type     VARCHAR(10),   -- MORNING | EVENING | BOTH

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_std_route ON student_transport_details(route_id);

-- ── student_hostel_details ───────────────────────────────────
CREATE TABLE student_hostel_details (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    hostel_required    BOOLEAN     NOT NULL DEFAULT FALSE,
    hostel_name        VARCHAR(100),
    room_number        VARCHAR(20),
    bed_number         VARCHAR(10),
    hostel_type        VARCHAR(10),  -- BOYS | GIRLS | MIXED

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ── student_documents ────────────────────────────────────────
CREATE TABLE student_documents (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    document_type      VARCHAR(40) NOT NULL,
    document_name      VARCHAR(200),
    file_url           TEXT        NOT NULL,
    file_size_kb       BIGINT,
    mime_type          VARCHAR(80),
    status             VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    verified_by        VARCHAR(100),
    verified_at        TIMESTAMP,
    rejection_reason   VARCHAR(500),
    is_mandatory       BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sd_tenant  ON student_documents(tenant_id);
CREATE INDEX idx_sd_student ON student_documents(student_profile_id);
CREATE INDEX idx_sd_status  ON student_documents(status);

-- ── student_scholarships ─────────────────────────────────────
CREATE TABLE student_scholarships (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    scholarship_type   VARCHAR(30) NOT NULL,
    scholarship_name   VARCHAR(200),
    discount_mode      VARCHAR(15),    -- PERCENTAGE | FLAT
    amount             NUMERIC(12,2),
    percentage         NUMERIC(5,2),
    concession_reason  VARCHAR(500),
    valid_from         DATE,
    valid_to           DATE,
    approval_status    VARCHAR(15)  NOT NULL DEFAULT 'PENDING',
    approved_by        VARCHAR(100),
    academic_session   VARCHAR(20),

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ss_tenant  ON student_scholarships(tenant_id);
CREATE INDEX idx_ss_student ON student_scholarships(student_profile_id);

-- ── student_status_history ───────────────────────────────────
CREATE TABLE student_status_history (
    id                 BIGSERIAL PRIMARY KEY,
    tenant_id          BIGINT      NOT NULL,
    student_profile_id BIGINT      NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    from_status        VARCHAR(30),
    to_status          VARCHAR(30) NOT NULL,
    changed_by         VARCHAR(100),
    remarks            VARCHAR(500),
    action             VARCHAR(50),
    effective_date     DATE,

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_by         VARCHAR(100),
    is_deleted         BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ssh_tenant  ON student_status_history(tenant_id);
CREATE INDEX idx_ssh_student ON student_status_history(student_profile_id);
