package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * An attempt by a student to pay one or more fees online. One Razorpay order
 * per attempt. States: CREATED | PENDING | COMPLETED | FAILED | EXPIRED | REQUIRES_REVIEW.
 */
@Entity
@Table(name = "payment_attempts", indexes = {
        @Index(name = "idx_pa_school", columnList = "school_id"),
        @Index(name = "idx_pa_student", columnList = "student_id"),
        @Index(name = "idx_pa_order", columnList = "razorpay_order_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentAttempt extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    /** The logged-in user (student) who initiated this. */
    @Column(name = "initiated_by_user_id")
    private Long initiatedByUserId;

    @Column(name = "gateway_account_id")
    private Long gatewayAccountId;

    /** CSV of Fee ids this attempt is paying. */
    @Column(name = "fee_ids", length = 1000)
    private String feeIds;

    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    /** Expected amount in the smallest unit (paise). */
    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "CREATED";

    /** Deterministic key preventing duplicate concurrent attempts for the same fees. */
    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;
}
