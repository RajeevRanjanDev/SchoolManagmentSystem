package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A Razorpay settlement (payout to the school's bank). States:
 * EXPECTED | SETTLED | PARTIALLY_SETTLED | DELAYED | REQUIRES_REVIEW.
 */
@Entity
@Table(name = "gateway_settlements", indexes = {
        @Index(name = "idx_settlement_school", columnList = "school_id")
}, uniqueConstraints = @UniqueConstraint(name = "uk_settlement_rzp", columnNames = {"school_id", "razorpay_settlement_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GatewaySettlement extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "razorpay_settlement_id")
    private String razorpaySettlementId;

    /** Bank reference / UTR. */
    @Column(name = "utr")
    private String utr;

    @Column(name = "gross_amount", precision = 14, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "fees", precision = 14, scale = 2)
    private BigDecimal fees;

    @Column(name = "tax", precision = 14, scale = 2)
    private BigDecimal tax;

    @Column(name = "net_amount", precision = 14, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "settled_on")
    private LocalDate settledOn;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "SETTLED";

    /** Set once a matching bank credit is found. */
    @Column(name = "bank_credit_matched", nullable = false)
    @Builder.Default
    private boolean bankCreditMatched = false;

    @Column(name = "bank_credit_amount", precision = 14, scale = 2)
    private BigDecimal bankCreditAmount;

    @Column(name = "bank_credit_date")
    private LocalDate bankCreditDate;
}
