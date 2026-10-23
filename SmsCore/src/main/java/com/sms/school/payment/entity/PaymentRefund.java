package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A refund against a captured transaction. Recorded separately; never erases
 * the original payment. States: REQUESTED | PROCESSING | PROCESSED | FAILED | REQUIRES_REVIEW.
 */
@Entity
@Table(name = "payment_refunds", indexes = {
        @Index(name = "idx_refund_txn", columnList = "payment_transaction_id"),
        @Index(name = "idx_refund_school", columnList = "school_id")
}, uniqueConstraints = @UniqueConstraint(name = "uk_refund_rzp", columnNames = "razorpay_refund_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentRefund extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "payment_transaction_id", nullable = false)
    private Long paymentTransactionId;

    @Column(name = "razorpay_refund_id")
    private String razorpayRefundId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "REQUESTED";

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
