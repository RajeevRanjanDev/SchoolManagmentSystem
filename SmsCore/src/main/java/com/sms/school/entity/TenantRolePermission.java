package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenant_role_permissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_role_id", "resource", "action"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantRolePermission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_role_id", nullable = false)
    private TenantRole tenantRole;

    @Column(name = "resource", nullable = false, length = 100)
    private String resource;

    /** CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT */
    @Column(name = "action", nullable = false, length = 50)
    private String action;
}
