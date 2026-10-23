package com.sms.school.entity;

import com.sms.school.entity.enums.FeeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A fee record assigned to a student for a given month/term.
 */
@Entity
@Table(name = "fees",
        indexes = {
                @Index(name = "idx_fee_student", columnList = "student_id"),
                @Index(name = "idx_fee_school", columnList = "school_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fee extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /** Category: "Tuition Fee", "Library Fee", "Sports Fee" etc. */
    @Column(name = "fee_category", nullable = false)
    private String feeCategory;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    /** e.g. "April 2024" or "Term 1" */
    @Column(name = "fee_period", nullable = false)
    private String feePeriod;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "discount", precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(name = "fine", precision = 10, scale = 2)
    private BigDecimal fine;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FeeStatus status = FeeStatus.PENDING;

    @Column(name = "remarks")
    private String remarks;
}
