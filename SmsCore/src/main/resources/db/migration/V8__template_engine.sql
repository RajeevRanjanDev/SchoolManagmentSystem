-- ============================================================
-- V8 : Template Engine
-- Provides institution-type-based default role, permission,
-- academic-structure, and fee-structure templates.
-- Applied automatically when a new tenant is created.
-- ============================================================

-- 1. Extend schools table with institution_type (backward compat – nullable)
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS institution_type VARCHAR(30) DEFAULT 'SCHOOL';

-- 2. Master template catalogue
CREATE TABLE institution_templates (
    id               BIGSERIAL PRIMARY KEY,
    institution_type VARCHAR(30)  NOT NULL UNIQUE,
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    version          INTEGER      NOT NULL DEFAULT 1,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_inst_tmpl_type ON institution_templates(institution_type);

-- 3. Default roles per template
CREATE TABLE template_roles (
    id                      BIGSERIAL PRIMARY KEY,
    template_id             BIGINT       NOT NULL REFERENCES institution_templates(id) ON DELETE CASCADE,
    role_name               VARCHAR(100) NOT NULL,
    display_name            VARCHAR(150) NOT NULL,
    description             TEXT,
    is_system_role          BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order              INTEGER      NOT NULL DEFAULT 0,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),
    is_deleted              BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (template_id, role_name)
);

CREATE INDEX idx_tmpl_roles_template ON template_roles(template_id);

-- 4. Default permissions per template role
CREATE TABLE template_permissions (
    id              BIGSERIAL PRIMARY KEY,
    template_id     BIGINT       NOT NULL REFERENCES institution_templates(id) ON DELETE CASCADE,
    template_role_id BIGINT      NOT NULL REFERENCES template_roles(id) ON DELETE CASCADE,
    resource        VARCHAR(100) NOT NULL,
    action          VARCHAR(50)  NOT NULL,   -- CREATE READ UPDATE DELETE APPROVE
    description     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (template_id, template_role_id, resource, action)
);

CREATE INDEX idx_tmpl_perms_role ON template_permissions(template_role_id);

-- 5. Default academic structure config per template
CREATE TABLE template_academic_structures (
    id                       BIGSERIAL PRIMARY KEY,
    template_id              BIGINT       NOT NULL REFERENCES institution_templates(id) ON DELETE CASCADE,
    structure_type           VARCHAR(50)  NOT NULL, -- CLASS_SECTION | PROGRAM_SEMESTER | BATCH_COURSE
    level_name               VARCHAR(100) NOT NULL, -- e.g. "Class 1-12", "Semester 1-8"
    supports_sections        BOOLEAN      NOT NULL DEFAULT FALSE,
    supports_subjects        BOOLEAN      NOT NULL DEFAULT TRUE,
    supports_programs        BOOLEAN      NOT NULL DEFAULT FALSE,
    supports_departments     BOOLEAN      NOT NULL DEFAULT FALSE,
    supports_semesters       BOOLEAN      NOT NULL DEFAULT FALSE,
    supports_batches         BOOLEAN      NOT NULL DEFAULT FALSE,
    max_levels               INTEGER,
    config_json              TEXT,         -- JSON blob for extra config
    created_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by               VARCHAR(100),
    updated_by               VARCHAR(100),
    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 6. Default fee structure components per template
CREATE TABLE template_fee_structures (
    id              BIGSERIAL PRIMARY KEY,
    template_id     BIGINT       NOT NULL REFERENCES institution_templates(id) ON DELETE CASCADE,
    fee_component   VARCHAR(100) NOT NULL,   -- TUITION | EXAM | TRANSPORT | HOSTEL | LIBRARY
    label           VARCHAR(150) NOT NULL,
    frequency       VARCHAR(30)  NOT NULL,   -- MONTHLY | QUARTERLY | ANNUAL | ONE_TIME
    is_mandatory    BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (template_id, fee_component)
);

-- 7. Record of which template was applied to which tenant
CREATE TABLE tenant_templates (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    template_id     BIGINT       NOT NULL REFERENCES institution_templates(id),
    applied_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    applied_by      VARCHAR(100),
    status          VARCHAR(20)  NOT NULL DEFAULT 'APPLIED',  -- APPLIED | CUSTOMIZED | FAILED
    error_log       TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id)
);

CREATE INDEX idx_tenant_tmpl_tenant ON tenant_templates(tenant_id);

-- ── Seed: default templates ────────────────────────────────────────────────

INSERT INTO institution_templates (institution_type, name, description) VALUES
('SCHOOL',              'K-12 School Template',           'Default template for schools with class/section structure'),
('COLLEGE',             'College Template',               'Default template for degree colleges with program/semester structure'),
('UNIVERSITY',          'University Template',            'Default template for universities with department/program structure'),
('COACHING_INSTITUTE',  'Coaching Institute Template',    'Default template for coaching centres with batch/course structure'),
('TRAINING_INSTITUTE',  'Training Institute Template',    'Default template for professional training institutes');

-- ── Seed: School default roles ─────────────────────────────────────────────

INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT t.id, r.role_name, r.display_name, r.is_system_role, r.sort_order
FROM institution_templates t,
(VALUES
    ('PRINCIPAL',       'Principal',        TRUE,  1),
    ('VICE_PRINCIPAL',  'Vice Principal',   FALSE, 2),
    ('TEACHER',         'Teacher',          FALSE, 3),
    ('ACCOUNTANT',      'Accountant',       FALSE, 4),
    ('LIBRARIAN',       'Librarian',        FALSE, 5),
    ('PARENT',          'Parent',           FALSE, 6),
    ('STUDENT',         'Student',          FALSE, 7),
    ('TRANSPORT_MANAGER','Transport Manager',FALSE,8)
) AS r(role_name, display_name, is_system_role, sort_order)
WHERE t.institution_type = 'SCHOOL';

-- ── Seed: College default roles ────────────────────────────────────────────

INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT t.id, r.role_name, r.display_name, r.is_system_role, r.sort_order
FROM institution_templates t,
(VALUES
    ('DEAN',                  'Dean',                   TRUE,  1),
    ('HOD',                   'Head of Department',     FALSE, 2),
    ('PROFESSOR',             'Professor',              FALSE, 3),
    ('ASSOCIATE_PROFESSOR',   'Associate Professor',    FALSE, 4),
    ('ASSISTANT_PROFESSOR',   'Assistant Professor',    FALSE, 5),
    ('ACCOUNTANT',            'Accountant',             FALSE, 6),
    ('LIBRARIAN',             'Librarian',              FALSE, 7),
    ('STUDENT',               'Student',                FALSE, 8)
) AS r(role_name, display_name, is_system_role, sort_order)
WHERE t.institution_type = 'COLLEGE';

-- ── Seed: University default roles ─────────────────────────────────────────

INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT t.id, r.role_name, r.display_name, r.is_system_role, r.sort_order
FROM institution_templates t,
(VALUES
    ('VICE_CHANCELLOR',       'Vice Chancellor',        TRUE,  1),
    ('REGISTRAR',             'Registrar',              FALSE, 2),
    ('DEAN',                  'Dean',                   FALSE, 3),
    ('HOD',                   'Head of Department',     FALSE, 4),
    ('PROFESSOR',             'Professor',              FALSE, 5),
    ('ASSOCIATE_PROFESSOR',   'Associate Professor',    FALSE, 6),
    ('ASSISTANT_PROFESSOR',   'Assistant Professor',    FALSE, 7),
    ('ACCOUNTANT',            'Accountant',             FALSE, 8),
    ('STUDENT',               'Student',                FALSE, 9)
) AS r(role_name, display_name, is_system_role, sort_order)
WHERE t.institution_type = 'UNIVERSITY';

-- ── Seed: Coaching default roles ───────────────────────────────────────────

INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT t.id, r.role_name, r.display_name, r.is_system_role, r.sort_order
FROM institution_templates t,
(VALUES
    ('DIRECTOR',        'Director',         TRUE,  1),
    ('BRANCH_MANAGER',  'Branch Manager',   FALSE, 2),
    ('FACULTY',         'Faculty',          FALSE, 3),
    ('COUNSELLOR',      'Counsellor',       FALSE, 4),
    ('ACCOUNTANT',      'Accountant',       FALSE, 5),
    ('STUDENT',         'Student',          FALSE, 6)
) AS r(role_name, display_name, is_system_role, sort_order)
WHERE t.institution_type = 'COACHING_INSTITUTE';

-- ── Seed: Training default roles ───────────────────────────────────────────

INSERT INTO template_roles (template_id, role_name, display_name, is_system_role, sort_order)
SELECT t.id, r.role_name, r.display_name, r.is_system_role, r.sort_order
FROM institution_templates t,
(VALUES
    ('TRAINING_HEAD',   'Training Head',    TRUE,  1),
    ('TRAINER',         'Trainer',          FALSE, 2),
    ('COORDINATOR',     'Coordinator',      FALSE, 3),
    ('ACCOUNTANT',      'Accountant',       FALSE, 4),
    ('TRAINEE',         'Trainee',          FALSE, 5)
) AS r(role_name, display_name, is_system_role, sort_order)
WHERE t.institution_type = 'TRAINING_INSTITUTE';

-- ── Seed: Template academic structures ────────────────────────────────────

INSERT INTO template_academic_structures
    (template_id, structure_type, level_name, supports_sections, supports_subjects,
     supports_programs, supports_departments, supports_semesters, supports_batches, max_levels)
SELECT t.id, s.structure_type, s.level_name, s.sup_sections, TRUE,
       s.sup_programs, s.sup_depts, s.sup_semesters, s.sup_batches, s.max_levels
FROM institution_templates t,
(VALUES
    ('SCHOOL',            'CLASS_SECTION',     'Class 1-12',          TRUE,  FALSE, FALSE, FALSE, FALSE, 12),
    ('COLLEGE',           'PROGRAM_SEMESTER',  'Program/Semester',    FALSE, TRUE,  TRUE,  TRUE,  FALSE, 8),
    ('UNIVERSITY',        'PROGRAM_SEMESTER',  'Dept/Program/Sem',    FALSE, TRUE,  TRUE,  TRUE,  FALSE, 12),
    ('COACHING_INSTITUTE','BATCH_COURSE',       'Batch/Course',        FALSE, FALSE, FALSE, FALSE, TRUE,  6),
    ('TRAINING_INSTITUTE','BATCH_COURSE',       'Batch/Module',        FALSE, FALSE, FALSE, FALSE, TRUE,  4)
) AS s(inst_type, structure_type, level_name, sup_sections, sup_programs, sup_depts, sup_semesters, sup_batches, max_levels)
WHERE t.institution_type = s.inst_type;

-- ── Seed: Template fee structures ─────────────────────────────────────────

INSERT INTO template_fee_structures (template_id, fee_component, label, frequency, is_mandatory, sort_order)
SELECT t.id, f.component, f.label, f.frequency, f.mandatory, f.sort_order
FROM institution_templates t,
(VALUES
    ('SCHOOL',            'TUITION_FEE',    'Tuition Fee',        'MONTHLY',     TRUE,  1),
    ('SCHOOL',            'EXAM_FEE',       'Examination Fee',    'QUARTERLY',   TRUE,  2),
    ('SCHOOL',            'LIBRARY_FEE',    'Library Fee',        'ANNUAL',      FALSE, 3),
    ('SCHOOL',            'TRANSPORT_FEE',  'Transport Fee',      'MONTHLY',     FALSE, 4),
    ('SCHOOL',            'HOSTEL_FEE',     'Hostel Fee',         'MONTHLY',     FALSE, 5),
    ('COLLEGE',           'TUITION_FEE',    'Semester Tuition',   'ANNUAL',      TRUE,  1),
    ('COLLEGE',           'EXAM_FEE',       'Examination Fee',    'ANNUAL',      TRUE,  2),
    ('COLLEGE',           'DEVELOPMENT_FEE','Development Fee',    'ANNUAL',      TRUE,  3),
    ('COLLEGE',           'HOSTEL_FEE',     'Hostel Fee',         'ANNUAL',      FALSE, 4),
    ('COACHING_INSTITUTE','COURSE_FEE',     'Course Fee',         'ONE_TIME',    TRUE,  1),
    ('COACHING_INSTITUTE','MATERIAL_FEE',   'Study Material Fee', 'ONE_TIME',    FALSE, 2),
    ('COACHING_INSTITUTE','TEST_SERIES_FEE','Test Series Fee',    'ONE_TIME',    FALSE, 3),
    ('TRAINING_INSTITUTE','TRAINING_FEE',   'Training Fee',       'ONE_TIME',    TRUE,  1),
    ('TRAINING_INSTITUTE','CERT_FEE',       'Certification Fee',  'ONE_TIME',    FALSE, 2)
) AS f(inst_type, component, label, frequency, mandatory, sort_order)
WHERE t.institution_type = f.inst_type;
