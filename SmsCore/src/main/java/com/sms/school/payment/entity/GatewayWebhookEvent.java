package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A received Razorpay webhook, persisted before processing so delivery can be
 * repeated safely (idempotent). event_id is unique where the provider supplies it.
 */
@Entity
@Table(name = "gateway_webhook_events",
        uniqueConstraints = @UniqueConstraint(name = "uk_webhook_event", columnNames = "event_id"),
        indexes = @Index(name = "idx_webhook_status", columnList = "processing_status"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GatewayWebhookEvent extends BaseEntity {

    @Column(name = "school_id")
    private Long schoolId;

    /** Razorpay 'x-razorpay-event-id' header where present. */
    @Column(name = "event_id")
    private String eventId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "signature_valid", nullable = false)
    @Builder.Default
    private boolean signatureValid = false;

    @Lob
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.LONGVARCHAR)
    @Column(name = "payload")
    private String payload;

    /** PENDING | PROCESSED | FAILED | IGNORED */
    @Column(name = "processing_status", nullable = false)
    @Builder.Default
    private String processingStatus = "PENDING";

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "received_at", nullable = false)
    @Builder.Default
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
