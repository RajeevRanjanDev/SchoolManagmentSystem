package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A platform subscription invoice issued by SUPER_ADMIN to a school tenant.
 * This tracks billing status (SA-045 / SA-048); it does not process payments.
 */
@Entity
@Table(name = "subscription_invoices", indexes = {
        @Index(name = "idx_invoice_school", columnList = "school_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "plan_code")
    private String planCode;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "billing_period")
    private String billingPeriod;        // MONTHLY | ANNUAL

    @Column(name = "amount", nullable = false)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    /** PENDING | PAID | OVERDUE | CANCELLED */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "notes")
    private String notes;
}
