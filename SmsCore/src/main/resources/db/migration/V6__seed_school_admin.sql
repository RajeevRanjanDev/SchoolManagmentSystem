-- =============================================================
--  V6 – Seed School Admin for Demo School
--  Password: School@1234 (BCrypt rounds=12)
-- =============================================================

-- Create school admin user
INSERT INTO users (first_name, last_name, email, password, is_active, is_deleted, user_type, school_id, created_at)
SELECT
    'School', 'Admin',
    'admin@dpsdemo.edu',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    TRUE, FALSE,
    'SCHOOL_USER',
    s.id,
    NOW()
FROM schools s
WHERE s.code = 'DPS-DEMO'
ON CONFLICT (email) DO NOTHING;

-- Assign SCHOOL_ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@dpsdemo.edu'
  AND r.name  = 'SCHOOL_ADMIN'
ON CONFLICT DO NOTHING;
