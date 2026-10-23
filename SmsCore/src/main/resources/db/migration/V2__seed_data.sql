-- =============================================================
--  V2 – Seed Data
--  Inserts the system roles, permissions, and a SUPER_ADMIN
-- =============================================================

-- ── Roles ─────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN',      'Platform-level super administrator'),
    ('SCHOOL_ADMIN',     'School-level administrator'),
    ('TEACHER',          'Teacher who manages academic activities'),
    ('PARENT',           'Parent/guardian of a student'),
    ('ACCOUNTANT',       'Manages fees and financial records'),
    ('LIBRARIAN',        'Manages the school library'),
    ('TRANSPORT_MANAGER','Manages buses and transport routes')
ON CONFLICT (name) DO NOTHING;

-- ── Permissions ───────────────────────────────────────────────────
INSERT INTO permissions (name, description, module) VALUES
    ('MANAGE_SCHOOLS',         'Create and manage schools',           'SCHOOL'),
    ('MANAGE_USERS',           'Create and manage user accounts',     'USER'),
    ('MANAGE_STUDENTS',        'Add, edit, delete students',          'STUDENT'),
    ('VIEW_STUDENTS',          'View student records',                'STUDENT'),
    ('MARK_ATTENDANCE',        'Mark daily attendance',               'ATTENDANCE'),
    ('VIEW_ATTENDANCE',        'View attendance records',             'ATTENDANCE'),
    ('MANAGE_HOMEWORK',        'Assign and edit homework',            'HOMEWORK'),
    ('VIEW_HOMEWORK',          'View homework',                       'HOMEWORK'),
    ('MANAGE_CLASSWORK',       'Upload and edit classwork',           'CLASSWORK'),
    ('MANAGE_CIRCULARS',       'Create and publish circulars',        'CIRCULAR'),
    ('VIEW_CIRCULARS',         'View circulars',                      'CIRCULAR'),
    ('MANAGE_EVENTS',          'Create and manage events',            'EVENT'),
    ('VIEW_EVENTS',            'View events and gallery',             'EVENT'),
    ('MANAGE_TIMETABLE',       'Create and edit timetable',           'TIMETABLE'),
    ('VIEW_TIMETABLE',         'View timetable',                      'TIMETABLE'),
    ('MANAGE_EXAMS',           'Schedule exams and upload results',   'EXAM'),
    ('VIEW_RESULTS',           'View exam results',                   'EXAM'),
    ('MANAGE_FEES',            'Create fee records and record payments','FEE'),
    ('VIEW_FEES',              'View fee history',                    'FEE'),
    ('MANAGE_LIBRARY',         'Add books and issue/return books',    'LIBRARY'),
    ('VIEW_LIBRARY',           'View available books',                'LIBRARY'),
    ('MANAGE_TRANSPORT',       'Manage routes and vehicles',          'TRANSPORT'),
    ('TRACK_BUS',              'View live bus location',              'TRANSPORT'),
    ('SEND_NOTIFICATIONS',     'Send push notifications',             'NOTIFICATION'),
    ('VIEW_DASHBOARD',         'View admin dashboard',                'DASHBOARD')
ON CONFLICT (name) DO NOTHING;

-- ── SUPER_ADMIN account ───────────────────────────────────────────
-- Default password: Admin@1234 (BCrypt)
INSERT INTO users (first_name, last_name, email, password, is_active, is_deleted, created_at)
VALUES ('Super', 'Admin', 'superadmin@sms.com',
        '$2a$12$LB8mfXWdmH7.pNXWGcUFUOlCrFmO7.E4Pp4zGwFjdVH0o7Q0pLHHK',
        TRUE, FALSE, NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign SUPER_ADMIN role to the seed user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'superadmin@sms.com'
  AND r.name  = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- ── Demo school ───────────────────────────────────────────────────
INSERT INTO schools (name, code, city, state, country, email, is_active, current_academic_year, is_deleted, created_at)
VALUES ('Demo Public School', 'DPS-DEMO', 'New Delhi', 'Delhi', 'India',
        'info@dpsdemo.edu', TRUE, '2024-2025', FALSE, NOW())
ON CONFLICT (code) DO NOTHING;
