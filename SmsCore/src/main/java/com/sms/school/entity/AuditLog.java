package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Immutable audit trail of important actions (no BaseEntity to keep it simple).
 * Written by AuditLogService on sensitive operations.
 */
@Entity
@Table(name = "audit_logs",
        indexes = {
                @Index(name = "idx_audit_school", columnList = "school_id"),
                @Index(name = "idx_audit_user", columnList = "performed_by_user_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id")
    private Long schoolId;

    @Column(name = "performed_by_user_id")
    private Long performedByUserId;

    @Column(name = "performed_by_email")
    private String performedByEmail;

    @Column(name = "action", nullable = false)
    private String action;         // e.g. "FEE_PAYMENT_RECORDED"

    @Column(name = "entity_type")
    private String entityType;     // e.g. "FeePayment"

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;        // JSON snapshot or description

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;
}
