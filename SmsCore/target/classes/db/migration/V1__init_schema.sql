-- =============================================================
--  V1 – Initial Database Schema
--  Multi-Tenant School Management System
--  This script creates ALL tables in dependency order.
-- =============================================================

-- ── Schools (tenant root) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
    id                   BIGSERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    code                 VARCHAR(50)  NOT NULL UNIQUE,
    address              TEXT,
    city                 VARCHAR(100),
    state                VARCHAR(100),
    country              VARCHAR(100),
    pincode              VARCHAR(20),
    phone                VARCHAR(30),
    email                VARCHAR(255),
    website              VARCHAR(255),
    logo_url             TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    current_academic_year VARCHAR(20),
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP,
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255)
);

-- ── Roles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

-- ── Permissions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module      VARCHAR(50),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

-- ── Role ↔ Permission join ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT REFERENCES schools(id),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(30),
    password            VARCHAR(255) NOT NULL,
    gender              VARCHAR(10),
    date_of_birth       DATE,
    profile_picture_url TEXT,
    address             TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    reset_token         VARCHAR(255),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_school ON users(school_id);

-- ── User ↔ Role join ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ── Refresh tokens ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id),
    token       VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

-- ── Transport routes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transport_routes (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT NOT NULL REFERENCES schools(id),
    route_name   VARCHAR(255) NOT NULL,
    route_code   VARCHAR(50) UNIQUE,
    start_point  VARCHAR(255),
    end_point    VARCHAR(255),
    stops        TEXT,
    monthly_fee  NUMERIC(10,2),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255)
);

-- ── Parents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parents (
    id              BIGSERIAL PRIMARY KEY,
    school_id       BIGINT NOT NULL REFERENCES schools(id),
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id),
    occupation      VARCHAR(255),
    relation        VARCHAR(50),
    alternate_phone VARCHAR(30),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- ── Students ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES schools(id),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    admission_number    VARCHAR(100) NOT NULL,
    date_of_birth       DATE,
    gender              VARCHAR(10),
    blood_group         VARCHAR(10),
    address             TEXT,
    profile_picture_url TEXT,
    admission_date      DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    parent_id           BIGINT REFERENCES parents(id),
    transport_route_id  BIGINT REFERENCES transport_routes(id),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    UNIQUE (school_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_student_school     ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_student_admission  ON students(admission_number);

-- ── Teachers ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT NOT NULL REFERENCES schools(id),
    user_id          BIGINT NOT NULL UNIQUE REFERENCES users(id),
    employee_code    VARCHAR(50) UNIQUE,
    qualification    VARCHAR(255),
    specialization   VARCHAR(255),
    joining_date     DATE,
    experience_years INTEGER,
    is_class_teacher BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- ── Classes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
    id            BIGSERIAL PRIMARY KEY,
    school_id     BIGINT NOT NULL REFERENCES schools(id),
    name          VARCHAR(100) NOT NULL,
    numeric_name  INTEGER,
    academic_year VARCHAR(20) NOT NULL,
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255)
);

-- ── Sections ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
    id                BIGSERIAL PRIMARY KEY,
    school_id         BIGINT NOT NULL REFERENCES schools(id),
    class_id          BIGINT NOT NULL REFERENCES classes(id),
    name              VARCHAR(10) NOT NULL,
    class_teacher_id  BIGINT REFERENCES teachers(id),
    max_capacity      INTEGER,
    is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255)
);

-- ── Student-Class mapping ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_class_mapping (
    id            BIGSERIAL PRIMARY KEY,
    school_id     BIGINT NOT NULL REFERENCES schools(id),
    student_id    BIGINT NOT NULL REFERENCES students(id),
    class_id      BIGINT NOT NULL REFERENCES classes(id),
    section_id    BIGINT NOT NULL REFERENCES sections(id),
    academic_year VARCHAR(20) NOT NULL,
    roll_number   VARCHAR(20),
    is_current    BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255)
);

-- ── Attendance ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id                    BIGSERIAL PRIMARY KEY,
    school_id             BIGINT NOT NULL REFERENCES schools(id),
    student_id            BIGINT NOT NULL REFERENCES students(id),
    section_id            BIGINT NOT NULL REFERENCES sections(id),
    marked_by_teacher_id  BIGINT REFERENCES teachers(id),
    attendance_date       DATE NOT NULL,
    status                VARCHAR(20) NOT NULL,
    remarks               TEXT,
    is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    UNIQUE (student_id, attendance_date)
);

-- ── Homework ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homework (
    id             BIGSERIAL PRIMARY KEY,
    school_id      BIGINT NOT NULL REFERENCES schools(id),
    section_id     BIGINT NOT NULL REFERENCES sections(id),
    teacher_id     BIGINT NOT NULL REFERENCES teachers(id),
    subject        VARCHAR(100) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    assigned_date  DATE NOT NULL,
    due_date       DATE NOT NULL,
    attachment_url TEXT,
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    created_by     VARCHAR(255),
    updated_by     VARCHAR(255)
);

-- ── Classwork ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classwork (
    id             BIGSERIAL PRIMARY KEY,
    school_id      BIGINT NOT NULL REFERENCES schools(id),
    section_id     BIGINT NOT NULL REFERENCES sections(id),
    teacher_id     BIGINT NOT NULL REFERENCES teachers(id),
    subject        VARCHAR(100) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    classwork_date DATE NOT NULL,
    attachment_url TEXT,
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    created_by     VARCHAR(255),
    updated_by     VARCHAR(255)
);

-- ── Circulars ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS circulars (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES schools(id),
    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    published_date      DATE NOT NULL,
    target_class_id     BIGINT REFERENCES classes(id),
    attachment_url      TEXT,
    is_published        BOOLEAN NOT NULL DEFAULT FALSE,
    published_by_user_id BIGINT REFERENCES users(id),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255)
);

-- ── Events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id                   BIGSERIAL PRIMARY KEY,
    school_id            BIGINT NOT NULL REFERENCES schools(id),
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    event_date           DATE NOT NULL,
    start_time           TIME,
    end_time             TIME,
    venue                VARCHAR(255),
    is_published         BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id   BIGINT REFERENCES users(id),
    is_deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP,
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255)
);

-- ── Event photos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_photos (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES schools(id),
    event_id            BIGINT NOT NULL REFERENCES events(id),
    photo_url           TEXT NOT NULL,
    caption             VARCHAR(500),
    uploaded_by_user_id BIGINT REFERENCES users(id),
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255)
);

-- ── Timetable ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetables (
    id            BIGSERIAL PRIMARY KEY,
    school_id     BIGINT NOT NULL REFERENCES schools(id),
    section_id    BIGINT NOT NULL REFERENCES sections(id),
    teacher_id    BIGINT NOT NULL REFERENCES teachers(id),
    subject       VARCHAR(100) NOT NULL,
    day_of_week   INTEGER NOT NULL,
    period_number INTEGER NOT NULL,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    room_number   VARCHAR(20),
    academic_year VARCHAR(20) NOT NULL,
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255)
);

-- ── Exams ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT NOT NULL REFERENCES schools(id),
    section_id       BIGINT NOT NULL REFERENCES sections(id),
    exam_name        VARCHAR(255) NOT NULL,
    subject          VARCHAR(100) NOT NULL,
    exam_date        DATE NOT NULL,
    start_time       VARCHAR(20),
    duration_minutes INTEGER,
    total_marks      NUMERIC(8,2) NOT NULL,
    passing_marks    NUMERIC(8,2),
    academic_year    VARCHAR(20) NOT NULL,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- ── Results ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
    id                    BIGSERIAL PRIMARY KEY,
    school_id             BIGINT NOT NULL REFERENCES schools(id),
    exam_id               BIGINT NOT NULL REFERENCES exams(id),
    student_id            BIGINT NOT NULL REFERENCES students(id),
    marks_obtained        NUMERIC(8,2) NOT NULL,
    grade                 VARCHAR(10),
    remarks               TEXT,
    is_published          BOOLEAN NOT NULL DEFAULT FALSE,
    entered_by_teacher_id BIGINT REFERENCES teachers(id),
    is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255)
);

-- ── Fees ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fees (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT NOT NULL REFERENCES schools(id),
    student_id   BIGINT NOT NULL REFERENCES students(id),
    fee_category VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    fee_period   VARCHAR(50) NOT NULL,
    amount       NUMERIC(10,2) NOT NULL,
    discount     NUMERIC(10,2),
    fine         NUMERIC(10,2),
    due_date     DATE NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    remarks      TEXT,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255)
);

-- ── Fee payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
    id                     BIGSERIAL PRIMARY KEY,
    school_id              BIGINT NOT NULL REFERENCES schools(id),
    fee_id                 BIGINT NOT NULL REFERENCES fees(id),
    amount_paid            NUMERIC(10,2) NOT NULL,
    payment_date           TIMESTAMP NOT NULL,
    payment_method         VARCHAR(30) NOT NULL,
    transaction_reference  VARCHAR(255),
    receipt_number         VARCHAR(100) UNIQUE,
    collected_by_user_id   BIGINT REFERENCES users(id),
    remarks                TEXT,
    is_deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP,
    created_by             VARCHAR(255),
    updated_by             VARCHAR(255)
);

-- ── Transport vehicles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transport_vehicles (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT NOT NULL REFERENCES schools(id),
    vehicle_number   VARCHAR(30) NOT NULL UNIQUE,
    vehicle_type     VARCHAR(30),
    capacity         INTEGER,
    driver_name      VARCHAR(255),
    driver_phone     VARCHAR(30),
    conductor_name   VARCHAR(255),
    conductor_phone  VARCHAR(30),
    gps_device_id    VARCHAR(100),
    route_id         BIGINT REFERENCES transport_routes(id),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- ── Bus tracking logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bus_tracking_logs (
    id          BIGSERIAL PRIMARY KEY,
    school_id   BIGINT NOT NULL REFERENCES schools(id),
    vehicle_id  BIGINT NOT NULL REFERENCES transport_vehicles(id),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    speed_kmh   DOUBLE PRECISION,
    recorded_at TIMESTAMP NOT NULL,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_btl_vehicle_time ON bus_tracking_logs(vehicle_id, recorded_at);

-- ── Library books ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS library_books (
    id                BIGSERIAL PRIMARY KEY,
    school_id         BIGINT NOT NULL REFERENCES schools(id),
    title             VARCHAR(255) NOT NULL,
    author            VARCHAR(255),
    isbn              VARCHAR(50),
    publisher         VARCHAR(255),
    publication_year  INTEGER,
    category          VARCHAR(100),
    total_copies      INTEGER NOT NULL DEFAULT 1,
    available_copies  INTEGER NOT NULL DEFAULT 1,
    status            VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    shelf_location    VARCHAR(100),
    is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255)
);

-- ── Book issues ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS book_issues (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT NOT NULL REFERENCES schools(id),
    book_id          BIGINT NOT NULL REFERENCES library_books(id),
    student_id       BIGINT NOT NULL REFERENCES students(id),
    issue_date       DATE NOT NULL,
    due_date         DATE NOT NULL,
    return_date      DATE,
    fine_amount      DOUBLE PRECISION,
    remarks          TEXT,
    issued_by_user_id BIGINT REFERENCES users(id),
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255)
);

-- ── Notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES schools(id),
    recipient_user_id   BIGINT NOT NULL REFERENCES users(id),
    title               VARCHAR(255) NOT NULL,
    body                TEXT,
    type                VARCHAR(50) NOT NULL,
    reference_id        BIGINT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    push_sent           BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255)
);

-- ── Devices (FCM tokens) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    fcm_token   VARCHAR(500) NOT NULL,
    device_type VARCHAR(20),
    device_name VARCHAR(255),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255)
);

-- ── Audit logs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id                     BIGSERIAL PRIMARY KEY,
    school_id              BIGINT,
    performed_by_user_id   BIGINT,
    performed_by_email     VARCHAR(255),
    action                 VARCHAR(100) NOT NULL,
    entity_type            VARCHAR(100),
    entity_id              BIGINT,
    details                TEXT,
    ip_address             VARCHAR(50),
    performed_at           TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(performed_by_user_id);
