package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

/**
 * A school's Razorpay gateway credentials (per-tenant). Secrets are AES-encrypted
 * at rest. A school may have TEST and LIVE accounts; one active per mode.
 */
@Entity
@Table(name = "school_payment_gateway_accounts", indexes = {
        @Index(name = "idx_spga_school", columnList = "school_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SchoolPaymentGatewayAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "provider", nullable = false)
    @Builder.Default
    private String provider = "RAZORPAY";

    /** TEST | LIVE */
    @Column(name = "mode", nullable = false)
    @Builder.Default
    private String mode = "TEST";

    @Column(name = "key_id", nullable = false)
    private String keyId;

    /** AES-encrypted. */
    @Column(name = "key_secret", nullable = false, length = 500)
    private String keySecret;

    /** AES-encrypted. */
    @Column(name = "webhook_secret", length = 500)
    private String webhookSecret;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
