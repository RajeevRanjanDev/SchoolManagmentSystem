-- =============================================================
--  V3 – Student-Parent Many-to-Many + Enrollment Enhancements
--  School Management System
-- =============================================================

-- ── 1. Make parents.user_id nullable ─────────────────────────
--     Admin can create a parent profile before they have a login.
ALTER TABLE parents
    ALTER COLUMN user_id DROP NOT NULL;

-- Drop old unique constraint on user_id so nullable works correctly
ALTER TABLE parents
    DROP CONSTRAINT IF EXISTS parents_user_id_key;

-- Re-add partial unique index: unique only when user_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS uq_parent_user_id
    ON parents (user_id)
    WHERE user_id IS NOT NULL;

-- ── 2. Add direct contact fields to parents ───────────────────
--     Parent records need first/last name and mobile directly
--     (not only via the User join which may not exist yet)
ALTER TABLE parents
    ADD COLUMN IF NOT EXISTS first_name     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS mobile         VARCHAR(30),
    ADD COLUMN IF NOT EXISTS email          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS photo_url      TEXT,
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- ── 3. Add extra fields to students ───────────────────────────
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS mobile         VARCHAR(30),
    ADD COLUMN IF NOT EXISTS email          VARCHAR(255),
    ADD COLUMN IF NOT EXISTS joining_date   DATE,
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- ── 4. Add enrollment status to student_class_mapping ─────────
--     Replaces the boolean is_current with a rich status:
--     ACTIVE | PROMOTED | TRANSFERRED | WITHDRAWN | GRADUATED
ALTER TABLE student_class_mapping
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Backfill: rows that had is_current=false → PROMOTED
UPDATE student_class_mapping
SET    status = 'PROMOTED'
WHERE  is_current = FALSE AND status = 'ACTIVE';

-- Add new unique constraint: only one ACTIVE row per student per year
CREATE UNIQUE INDEX IF NOT EXISTS uq_scm_student_year_active
    ON student_class_mapping (school_id, student_id, academic_year)
    WHERE status = 'ACTIVE' AND is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_scm_student_year
    ON student_class_mapping (student_id, academic_year);

CREATE INDEX IF NOT EXISTS idx_scm_section_year
    ON student_class_mapping (section_id, academic_year, status);

-- ── 5. Student-Parent many-to-many mapping ────────────────────
--     A student can have father + mother + guardian.
--     A parent can have multiple children.
CREATE TABLE IF NOT EXISTS student_parent_mappings (
    id                    BIGSERIAL     PRIMARY KEY,
    school_id             BIGINT        NOT NULL REFERENCES schools(id),
    student_id            BIGINT        NOT NULL REFERENCES students(id),
    parent_id             BIGINT        NOT NULL REFERENCES parents(id),
    relationship_type     VARCHAR(30)   NOT NULL
                          CHECK (relationship_type IN ('FATHER','MOTHER','GUARDIAN','STEP_PARENT','SIBLING_GUARDIAN')),
    is_primary_contact    BOOLEAN       NOT NULL DEFAULT FALSE,
    is_emergency_contact  BOOLEAN       NOT NULL DEFAULT FALSE,
    can_pickup            BOOLEAN       NOT NULL DEFAULT TRUE,
    is_deleted            BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    CONSTRAINT uq_student_parent_mapping UNIQUE (school_id, student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_spm_student
    ON student_parent_mappings (school_id, student_id) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_spm_parent
    ON student_parent_mappings (school_id, parent_id) WHERE NOT is_deleted;

-- Backfill: migrate existing students.parent_id → student_parent_mappings
-- Only if a student already has a parent_id (old single-parent design)
INSERT INTO student_parent_mappings
    (school_id, student_id, parent_id, relationship_type,
     is_primary_contact, is_emergency_contact, can_pickup, created_at)
SELECT s.school_id, s.id, s.parent_id, 'FATHER',
       TRUE, TRUE, TRUE, NOW()
FROM   students s
WHERE  s.parent_id IS NOT NULL
  AND  s.is_deleted = FALSE
ON CONFLICT (school_id, student_id, parent_id) DO NOTHING;

-- ── 6. Homework submissions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS homework_submissions (
    id               BIGSERIAL     PRIMARY KEY,
    school_id        BIGINT        NOT NULL REFERENCES schools(id),
    homework_id      BIGINT        NOT NULL REFERENCES homework(id),
    student_id       BIGINT        NOT NULL REFERENCES students(id),
    submission_url   TEXT,
    text_response    TEXT,
    submitted_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    status           VARCHAR(20)   NOT NULL DEFAULT 'SUBMITTED'
                     CHECK (status IN ('SUBMITTED','LATE','REVIEWED','GRADED')),
    grade            VARCHAR(10),
    teacher_remarks  TEXT,
    reviewed_by      BIGINT        REFERENCES users(id),
    reviewed_at      TIMESTAMP,
    is_deleted       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    CONSTRAINT uq_homework_submission UNIQUE (school_id, homework_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_hws_homework
    ON homework_submissions (school_id, homework_id);

CREATE INDEX IF NOT EXISTS idx_hws_student
    ON homework_submissions (school_id, student_id);

-- ── 7. Indexes on existing tables for parent-dashboard queries ─
CREATE INDEX IF NOT EXISTS idx_attendance_student_date
    ON attendance (student_id, attendance_date) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_homework_section_due
    ON homework (section_id, due_date) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_results_student
    ON results (student_id) WHERE NOT is_deleted;

CREATE INDEX IF NOT EXISTS idx_fees_student_year
    ON fees (student_id, academic_year) WHERE NOT is_deleted;
