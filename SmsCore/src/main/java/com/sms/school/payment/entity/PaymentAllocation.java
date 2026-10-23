package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * How a captured transaction's amount was applied to a specific fee invoice.
 * Supports paying multiple fees in one checkout. Unique per (transaction, fee)
 * so re-processing a webhook never double-allocates.
 */
@Entity
@Table(name = "payment_allocations",
        uniqueConstraints = @UniqueConstraint(name = "uk_alloc_txn_fee", columnNames = {"payment_transaction_id", "fee_id"}),
        indexes = {
                @Index(name = "idx_alloc_txn", columnList = "payment_transaction_id"),
                @Index(name = "idx_alloc_fee", columnList = "fee_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentAllocation extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "payment_transaction_id", nullable = false)
    private Long paymentTransactionId;

    @Column(name = "fee_id", nullable = false)
    private Long feeId;

    @Column(name = "student_id")
    private Long studentId;

    /** The FeePayment row created in the existing ledger for this allocation. */
    @Column(name = "fee_payment_id")
    private Long feePaymentId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "allocated_at", nullable = false)
    @Builder.Default
    private LocalDateTime allocatedAt = LocalDateTime.now();
}
