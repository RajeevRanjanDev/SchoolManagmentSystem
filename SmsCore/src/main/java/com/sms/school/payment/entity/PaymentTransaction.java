package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A captured (or attempted) gateway transaction tied to a payment attempt.
 * States: CREATED | AUTHORIZED | CAPTURED | FAILED | REFUNDED | PARTIALLY_REFUNDED.
 */
@Entity
@Table(name = "payment_transactions", indexes = {
        @Index(name = "idx_pt_school", columnList = "school_id"),
        @Index(name = "idx_pt_attempt", columnList = "payment_attempt_id")
}, uniqueConstraints = @UniqueConstraint(name = "uk_pt_rzp_payment", columnNames = "razorpay_payment_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentTransaction extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "payment_attempt_id", nullable = false)
    private Long paymentAttemptId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    @Column(name = "method")
    private String method;            // upi | card | netbanking | ...

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "captured_amount", precision = 12, scale = 2)
    private BigDecimal capturedAmount;

    @Column(name = "amount_refunded", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal amountRefunded = BigDecimal.ZERO;

    @Column(name = "currency")
    @Builder.Default
    private String currency = "INR";

    /** Our internal state. */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "CREATED";

    /** The raw gateway status, preserved for audit. */
    @Column(name = "gateway_status")
    private String gatewayStatus;

    @Column(name = "captured_at")
    private LocalDateTime capturedAt;

    /** True once the captured amount has been allocated to fee invoices. */
    @Column(name = "allocated", nullable = false)
    @Builder.Default
    private boolean allocated = false;

    /** Consolidated online-payment receipt number (one per captured transaction). */
    @Column(name = "receipt_number", unique = true)
    private String receiptNumber;

    @Column(name = "receipt_issued_at")
    private LocalDateTime receiptIssuedAt;

    /** The settlement this payment was paid out in (settlement reconciliation). */
    @Column(name = "gateway_settlement_id")
    private Long gatewaySettlementId;
}
