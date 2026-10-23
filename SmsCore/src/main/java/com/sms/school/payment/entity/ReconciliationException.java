package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * An inconsistency found during reconciliation that needs human attention.
 * States: OPEN | INVESTIGATING | RESOLVED | WAIVED_WITH_APPROVAL.
 */
@Entity
@Table(name = "reconciliation_exceptions", indexes = {
        @Index(name = "idx_recon_exc_school", columnList = "school_id"),
        @Index(name = "idx_recon_exc_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReconciliationException extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "reconciliation_run_id")
    private Long reconciliationRunId;

    /**
     * PAYMENT_NOT_ALLOCATED | PAYMENT_STATUS_PENDING | DUPLICATE_PAYMENT |
     * SETTLEMENT_NOT_MATCHED | BANK_CREDIT_NOT_MATCHED | AMOUNT_MISMATCH
     */
    @Column(name = "exception_type", nullable = false)
    private String exceptionType;

    @Column(name = "reference_type")
    private String referenceType;     // PAYMENT | SETTLEMENT | ...

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;

    @Column(name = "resolved_by_user_id")
    private Long resolvedByUserId;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
