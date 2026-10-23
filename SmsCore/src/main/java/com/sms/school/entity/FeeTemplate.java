package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * A reusable fee structure the admin defines once (e.g. "Class 1-3 Tuition = ₹4000")
 * and then assigns to a whole class. Carries the billing policy: frequency, due date,
 * grace period, late-fee rules, partial-payment flag, reminder schedule and concession.
 */
@Entity
@Table(name = "fee_templates",
        indexes = @Index(name = "idx_fee_template_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    /** Human name, e.g. "Class 1-3 Tuition" or "Annual Picnic". */
    @Column(name = "name", nullable = false)
    private String name;

    /** Fee type: TUITION | ACTIVITY | TRANSPORT | EXAM | LIBRARY | ADMISSION | OTHER */
    @Column(name = "fee_type", nullable = false)
    private String feeType;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** MONTHLY | QUARTERLY | HALF_YEARLY | ANNUAL | ONE_TIME */
    @Builder.Default
    @Column(name = "frequency", nullable = false)
    private String frequency = "MONTHLY";

    /** Day of month the fee is due, e.g. 10. */
    @Column(name = "due_day_of_month")
    private Integer dueDayOfMonth;

    @Builder.Default
    @Column(name = "grace_days")
    private Integer graceDays = 0;

    // ── Late fee ────────────────────────────────────────────────────────────
    @Builder.Default
    @Column(name = "late_fee_enabled", nullable = false)
    private boolean lateFeeEnabled = false;

    @Column(name = "late_fee_amount", precision = 10, scale = 2)
    private BigDecimal lateFeeAmount;

    /** Optional extra charge per additional overdue month. */
    @Column(name = "repeated_late_fee_amount", precision = 10, scale = 2)
    private BigDecimal repeatedLateFeeAmount;

    @Builder.Default
    @Column(name = "partial_allowed", nullable = false)
    private boolean partialAllowed = false;

    /** When partial payments are allowed, the minimum % of the fee that must be paid per installment. */
    @Column(name = "min_partial_percent")
    private Integer minPartialPercent;

    // ── Reminder schedule ───────────────────────────────────────────────────
    @Column(name = "reminder_days_before")
    private Integer reminderDaysBefore;

    @Builder.Default
    @Column(name = "reminder_on_due_date", nullable = false)
    private boolean reminderOnDueDate = false;

    @Column(name = "reminder_days_after")
    private Integer reminderDaysAfter;

    // ── Concession ──────────────────────────────────────────────────────────
    /** NONE | FIXED | PERCENT */
    @Builder.Default
    @Column(name = "concession_type", nullable = false)
    private String concessionType = "NONE";

    @Column(name = "concession_value", precision = 10, scale = 2)
    private BigDecimal concessionValue;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    /** ACTIVE | INACTIVE */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
