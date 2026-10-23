-- ============================================================
-- V12 : Per-Tenant Dynamic Roles
-- Separate from the global roles table (which uses RoleName enum).
-- Template engine creates records here when applying a template.
-- Existing global roles/permissions are UNTOUCHED.
-- ============================================================

CREATE TABLE tenant_roles (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    role_name       VARCHAR(100) NOT NULL,
    display_name    VARCHAR(150) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, role_name)
);

CREATE INDEX idx_tenant_roles_tenant ON tenant_roles(tenant_id);

CREATE TABLE tenant_role_permissions (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT       NOT NULL REFERENCES schools(id),
    tenant_role_id  BIGINT       NOT NULL REFERENCES tenant_roles(id) ON DELETE CASCADE,
    resource        VARCHAR(100) NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_role_id, resource, action)
);

CREATE INDEX idx_tenant_role_perms ON tenant_role_permissions(tenant_role_id);

-- User-to-TenantRole mapping (supplement existing user_roles which uses global roles)
CREATE TABLE user_tenant_roles (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES schools(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    tenant_role_id  BIGINT NOT NULL REFERENCES tenant_roles(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (tenant_id, user_id, tenant_role_id)
);
