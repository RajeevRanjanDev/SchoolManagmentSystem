-- =============================================================
--  V4 – Teacher Subject & Assignment System
--  Adds: subjects table, teacher_assignments, classwork,
--        class_announcements; enhances teachers table.
-- =============================================================

-- ── 1. Enhance teachers table ─────────────────────────────────────────────────
ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS photo_url   TEXT,
    ADD COLUMN IF NOT EXISTS mobile      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email       VARCHAR(150),
    ADD COLUMN IF NOT EXISTS status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Remove the old scalar is_class_teacher flag from teachers —
-- class-teacher status now lives per-assignment per-section per-year.
-- We keep the column for backward-compat queries but no longer rely on it.

-- ── 2. Subjects master table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
    id              BIGSERIAL    PRIMARY KEY,
    school_id       BIGINT       NOT NULL REFERENCES schools(id),
    subject_code    VARCHAR(50),
    subject_name    VARCHAR(150) NOT NULL,
    description     TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_subject_code
    ON subjects (school_id, subject_code)
    WHERE subject_code IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_subject_school
    ON subjects (school_id) WHERE is_deleted = FALSE;

-- ── 3. Teacher assignments (teacher ↔ class ↔ section ↔ subject) ─────────────
--
--  One row = "Teacher T teaches Subject S in Section SEC (Class C), Year Y"
--  is_class_teacher = TRUE means T is the homeroom/class teacher for that section.
--  Multiple subjects in same section = multiple rows (same teacher, same section).
--
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id               BIGSERIAL    PRIMARY KEY,
    school_id        BIGINT       NOT NULL REFERENCES schools(id),
    teacher_id       BIGINT       NOT NULL REFERENCES teachers(id),
    class_id         BIGINT       NOT NULL REFERENCES classes(id),
    section_id       BIGINT       NOT NULL REFERENCES sections(id),
    subject_id       BIGINT       NOT NULL REFERENCES subjects(id),
    academic_year    VARCHAR(10)  NOT NULL,           -- e.g. "2025-26"
    is_class_teacher BOOLEAN      NOT NULL DEFAULT FALSE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- Only one teacher per subject per section per year
CREATE UNIQUE INDEX IF NOT EXISTS uq_ta_section_subject_year
    ON teacher_assignments (school_id, section_id, subject_id, academic_year)
    WHERE is_deleted = FALSE;

-- Only one class teacher per section per year
CREATE UNIQUE INDEX IF NOT EXISTS uq_ta_class_teacher_section_year
    ON teacher_assignments (school_id, section_id, academic_year)
    WHERE is_class_teacher = TRUE AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_ta_teacher
    ON teacher_assignments (school_id, teacher_id, academic_year) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_ta_section
    ON teacher_assignments (school_id, section_id, academic_year) WHERE is_deleted = FALSE;

-- ── 4. Enhance existing classwork table ───────────────────────────────────────
--  classwork table already exists (V1); add columns to support subject FK,
--  assignment FK, academic year, class FK, and separate topic/notes fields.
ALTER TABLE classwork
    ADD COLUMN IF NOT EXISTS subject_id    BIGINT REFERENCES subjects(id),
    ADD COLUMN IF NOT EXISTS assignment_id BIGINT REFERENCES teacher_assignments(id),
    ADD COLUMN IF NOT EXISTS class_id      BIGINT REFERENCES classes(id),
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(10),
    ADD COLUMN IF NOT EXISTS topic         VARCHAR(300),
    ADD COLUMN IF NOT EXISTS notes         TEXT;

-- Backfill topic from title for existing rows
UPDATE classwork SET topic = title WHERE topic IS NULL;

CREATE INDEX IF NOT EXISTS idx_classwork_section_date
    ON classwork (school_id, section_id, classwork_date) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_classwork_teacher
    ON classwork (school_id, teacher_id) WHERE is_deleted = FALSE;

-- ── 5. Class announcements (teacher → class/section notices) ─────────────────
CREATE TABLE IF NOT EXISTS class_announcements (
    id            BIGSERIAL    PRIMARY KEY,
    school_id     BIGINT       NOT NULL REFERENCES schools(id),
    teacher_id    BIGINT       NOT NULL REFERENCES teachers(id),
    class_id      BIGINT       NOT NULL REFERENCES classes(id),
    section_id    BIGINT       REFERENCES sections(id),  -- NULL = whole class
    title         VARCHAR(300) NOT NULL,
    content       TEXT         NOT NULL,
    attachment_url TEXT,
    is_published  BOOLEAN      NOT NULL DEFAULT TRUE,
    published_at  TIMESTAMP,
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_ca_section
    ON class_announcements (school_id, section_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_ca_class
    ON class_announcements (school_id, class_id) WHERE is_deleted = FALSE;

-- ── 6. Enhance homework with subject FK ───────────────────────────────────────
ALTER TABLE homework
    ADD COLUMN IF NOT EXISTS subject_id    BIGINT REFERENCES subjects(id),
    ADD COLUMN IF NOT EXISTS assignment_id BIGINT REFERENCES teacher_assignments(id);

-- Backfill: leave subject_id NULL for existing rows (subject is still VARCHAR).

-- ── 7. Additional performance indexes ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hw_teacher
    ON homework (school_id, teacher_id) WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_teacher_school_status
    ON teachers (school_id, status) WHERE is_deleted = FALSE;
