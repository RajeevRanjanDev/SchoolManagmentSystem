package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Immutable audit trail for all super-admin actions on tenants.
 *
 * Every create/update/status-change performed by a SUPER_ADMIN is logged here.
 * school_id is nullable: null means a platform-level action (e.g. plan created).
 *
 * NEVER update or delete rows from this table — it is append-only.
 */
@Entity
@Table(name = "tenant_audit_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null = platform-level action (no specific school) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", nullable = false)
    private User performedBy;

    /** Action code: CREATE_SCHOOL, UPDATE_SCHOOL, SUSPEND_SCHOOL, ACTIVATE_SCHOOL,
     *  CREATE_ADMIN, ASSIGN_PLAN, RESET_DATA, etc. */
    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "description")
    private String description;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
