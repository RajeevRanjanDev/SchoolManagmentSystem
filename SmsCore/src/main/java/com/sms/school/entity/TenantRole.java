package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-tenant dynamic role.
 * Created by the template engine when a new tenant is onboarded.
 * Separate from the global Role entity (which uses a fixed RoleName enum).
 * Enables per-institution role customization without enum changes.
 */
@Entity
@Table(name = "tenant_roles",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "role_name"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantRole extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "role_name", nullable = false, length = 100)
    private String roleName;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_system_role", nullable = false)
    @Builder.Default
    private boolean systemRole = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "tenantRole", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TenantRolePermission> permissions = new ArrayList<>();
}
