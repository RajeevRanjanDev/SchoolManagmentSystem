package com.sms.school.ops.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A captured application/business failure, scoped to a school where known.
 * Powers the Super Admin → Operations dashboard. Separate from audit history and
 * from payment/reconciliation records (those are authoritative business data).
 *
 * Duplicate failures are grouped by {@code fingerprint}; repeats bump
 * {@code occurrenceCount} and {@code lastSeenAt} instead of inserting new rows.
 */
@Entity
@Table(name = "system_error_logs", indexes = {
        @Index(name = "idx_sel_school", columnList = "school_id"),
        @Index(name = "idx_sel_service", columnList = "service"),
        @Index(name = "idx_sel_severity", columnList = "severity"),
        @Index(name = "idx_sel_status", columnList = "status"),
        @Index(name = "idx_sel_created", columnList = "created_at"),
        @Index(name = "idx_sel_fingerprint", columnList = "fingerprint")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemErrorLog extends BaseEntity {

    /** Null = platform-level (no tenant resolved). */
    @Column(name = "school_id")
    private Long schoolId;

    /** AUTH | STUDENT | FEE | PAYMENT | WEBHOOK | RECONCILIATION | NOTIFICATION | API | ... */
    @Column(name = "service", nullable = false)
    private String service;

    /** WARN | ERROR | CRITICAL */
    @Column(name = "severity", nullable = false)
    @Builder.Default
    private String severity = "ERROR";

    @Column(name = "error_code")
    private String errorCode;

    @Column(name = "message", length = 2000)
    private String message;

    @Column(name = "stack_trace", columnDefinition = "text")
    private String stackTrace;

    @Column(name = "request_id")
    private String requestId;

    @Column(name = "trace_id")
    private String traceId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "http_method")
    private String httpMethod;

    @Column(name = "http_path", length = 500)
    private String httpPath;

    @Column(name = "http_status")
    private Integer httpStatus;

    /** Related business object, when applicable: PAYMENT_ATTEMPT | INVOICE | STUDENT | ... */
    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "environment")
    private String environment;

    /** Dedup key: service + errorCode + hashed message. */
    @Column(name = "fingerprint")
    private String fingerprint;

    @Column(name = "occurrence_count", nullable = false)
    @Builder.Default
    private int occurrenceCount = 1;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    /** OPEN | INVESTIGATING | RESOLVED */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "resolution_note", length = 2000)
    private String resolutionNote;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
