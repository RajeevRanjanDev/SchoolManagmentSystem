-- =============================================================
--  V5 – Multi-Tenant SaaS Architecture
--  Extends schools table to full tenant master.
--  Adds: subscription_plans, tenant_branding, tenant_settings,
--        tenant_audit_log. Hardens user/tenant linkage.
-- =============================================================

-- ── 1. Subscription Plans (platform-level, no school_id) ──────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
    id              BIGSERIAL PRIMARY KEY,
    plan_code       VARCHAR(50)     NOT NULL UNIQUE,
    plan_name       VARCHAR(100)    NOT NULL,
    description     TEXT,
    max_students    INT             NOT NULL DEFAULT 500,
    max_teachers    INT             NOT NULL DEFAULT 50,
    max_parents     INT             NOT NULL DEFAULT 1000,
    max_storage_gb  INT             NOT NULL DEFAULT 5,
    features        JSONB           NOT NULL DEFAULT '{}',
    monthly_price   NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    annual_price    NUMERIC(10, 2)  NOT NULL DEFAULT 0,
    trial_days      INT             NOT NULL DEFAULT 30,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- Seed default plans
INSERT INTO subscription_plans (plan_code, plan_name, description, max_students, max_teachers, max_parents, monthly_price, annual_price, trial_days)
VALUES
    ('TRIAL',      'Free Trial',     '30-day free trial, all features',       100,  10,  200,    0,      0,    30),
    ('BASIC',      'Basic',          'Small school up to 300 students',        300,  25,  600,  999,   9990,   0),
    ('STANDARD',   'Standard',       'Medium school up to 1000 students',     1000,  75, 2000, 2499,  24990,   0),
    ('PROFESSIONAL','Professional',  'Large school up to 3000 students',      3000, 150, 6000, 4999,  49990,   0),
    ('ENTERPRISE', 'Enterprise',     'Unlimited students, custom branding', 999999, 999, 999999, 0,      0,   0)
ON CONFLICT (plan_code) DO NOTHING;

-- ── 2. Extend Schools table to full Tenant Master ──────────────────────────────

ALTER TABLE schools ADD COLUMN IF NOT EXISTS legal_name           VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_plan_id BIGINT REFERENCES subscription_plans(id);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_expiry  DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS mobile               VARCHAR(20);

-- Backfill status from is_active for all existing rows
UPDATE schools SET status = CASE WHEN is_active = TRUE THEN 'ACTIVE' ELSE 'SUSPENDED' END
WHERE status = 'ACTIVE';  -- default was just set, safe to update

-- Seed default plan for existing schools (assign BASIC)
UPDATE schools
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE plan_code = 'BASIC')
WHERE subscription_plan_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_schools_status     ON schools(status)     WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_schools_code       ON schools(code)       WHERE is_deleted = FALSE;

-- ── 3. Tenant Branding ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_branding (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT          NOT NULL UNIQUE REFERENCES schools(id),
    logo_url         TEXT,
    favicon_url      TEXT,
    banner_url       TEXT,
    primary_color    VARCHAR(10)     NOT NULL DEFAULT '#1976D2',
    secondary_color  VARCHAR(10)     NOT NULL DEFAULT '#FF5722',
    accent_color     VARCHAR(10)     NOT NULL DEFAULT '#4CAF50',
    tagline          VARCHAR(300),
    custom_css       TEXT,
    is_deleted       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- Backfill branding from schools.logo_url for existing tenants
INSERT INTO tenant_branding (school_id, logo_url)
SELECT id, logo_url FROM schools WHERE is_deleted = FALSE
ON CONFLICT (school_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_branding_school ON tenant_branding(school_id);

-- ── 4. Tenant Settings (key-value per tenant) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_settings (
    id            BIGSERIAL PRIMARY KEY,
    school_id     BIGINT       NOT NULL REFERENCES schools(id),
    setting_key   VARCHAR(100) NOT NULL,
    setting_value TEXT,
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    UNIQUE (school_id, setting_key)
);

-- Seed default settings for existing schools
INSERT INTO tenant_settings (school_id, setting_key, setting_value)
SELECT s.id, 'attendance.auto_close_time',  '18:00' FROM schools s WHERE s.is_deleted = FALSE
ON CONFLICT (school_id, setting_key) DO NOTHING;
INSERT INTO tenant_settings (school_id, setting_key, setting_value)
SELECT s.id, 'fees.late_fine_per_day',      '10'    FROM schools s WHERE s.is_deleted = FALSE
ON CONFLICT (school_id, setting_key) DO NOTHING;
INSERT INTO tenant_settings (school_id, setting_key, setting_value)
SELECT s.id, 'homework.max_days_to_submit', '7'     FROM schools s WHERE s.is_deleted = FALSE
ON CONFLICT (school_id, setting_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_settings_school ON tenant_settings(school_id, setting_key);

-- ── 5. Users – add user_type column ──────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(30) NOT NULL DEFAULT 'SCHOOL_USER';

-- Mark existing SUPER_ADMIN users
UPDATE users u
SET user_type = 'SUPER_ADMIN'
WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND r.name = 'SUPER_ADMIN'
);

CREATE INDEX IF NOT EXISTS idx_users_type       ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_school_type ON users(school_id, user_type) WHERE school_id IS NOT NULL;

-- ── 6. Tenant Audit Log ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_audit_log (
    id                    BIGSERIAL PRIMARY KEY,
    school_id             BIGINT       REFERENCES schools(id),   -- NULL = platform-level
    performed_by_user_id  BIGINT       NOT NULL REFERENCES users(id),
    action                VARCHAR(100) NOT NULL,  -- CREATE_SCHOOL, SUSPEND_SCHOOL, etc.
    entity_type           VARCHAR(100),
    entity_id             BIGINT,
    description           TEXT,
    old_value             JSONB,
    new_value             JSONB,
    ip_address            VARCHAR(45),
    user_agent            VARCHAR(500),
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_school     ON tenant_audit_log(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user       ON tenant_audit_log(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON tenant_audit_log(created_at DESC);

-- ── 7. Composite performance indexes on business tables ───────────────────────
--      Ensures every tenant-scoped query uses an efficient index.

-- teachers (added in V1/V4)
CREATE INDEX IF NOT EXISTS idx_teachers_school_status  ON teachers(school_id, status)  WHERE is_deleted = FALSE;

-- students
CREATE INDEX IF NOT EXISTS idx_students_school_active  ON students(school_id, is_active) WHERE is_deleted = FALSE;

-- student_class_mappings
CREATE INDEX IF NOT EXISTS idx_scm_school_year_status ON student_class_mappings(school_id, academic_year, status);

-- homework
CREATE INDEX IF NOT EXISTS idx_homework_school_section ON homework(school_id, section_id) WHERE is_deleted = FALSE;

-- homework_submissions
CREATE INDEX IF NOT EXISTS idx_hw_sub_school_student  ON homework_submissions(school_id, student_id) WHERE is_deleted = FALSE;

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_student_date ON attendance(school_id, student_id, attendance_date);

-- fees
CREATE INDEX IF NOT EXISTS idx_fees_school_student_year ON fees(school_id, student_id, academic_year) WHERE is_deleted = FALSE;

-- results
CREATE INDEX IF NOT EXISTS idx_results_school_student ON results(school_id, student_id) WHERE is_deleted = FALSE;

-- teacher_assignments
CREATE INDEX IF NOT EXISTS idx_ta_school_year ON teacher_assignments(school_id, academic_year) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ta_school_teacher_year ON teacher_assignments(school_id, teacher_id, academic_year) WHERE is_deleted = FALSE;

-- ── 8. Ensure SUPER_ADMIN role seed ──────────────────────────────────────────

INSERT INTO roles (name, description)
VALUES ('SUPER_ADMIN', 'Platform-level administrator – full access to all tenants')
ON CONFLICT (name) DO NOTHING;

-- ── ROLLBACK SCRIPT (run in reverse for rollback) ─────────────────────────────
-- DROP TABLE IF EXISTS tenant_audit_log CASCADE;
-- DROP TABLE IF EXISTS tenant_settings CASCADE;
-- DROP TABLE IF EXISTS tenant_branding CASCADE;
-- DROP TABLE IF EXISTS subscription_plans CASCADE;
-- ALTER TABLE schools DROP COLUMN IF EXISTS legal_name;
-- ALTER TABLE schools DROP COLUMN IF EXISTS subscription_plan_id;
-- ALTER TABLE schools DROP COLUMN IF EXISTS subscription_expiry;
-- ALTER TABLE schools DROP COLUMN IF EXISTS status;
-- ALTER TABLE schools DROP COLUMN IF EXISTS mobile;
-- ALTER TABLE users  DROP COLUMN IF EXISTS user_type;
