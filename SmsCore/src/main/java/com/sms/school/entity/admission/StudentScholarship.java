package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.ScholarshipType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Scholarship / discount / concession awarded to a student.
 * Fee structure assignment is automatic via the rule engine — NOT here.
 */
@Entity
@Table(
    name = "student_scholarships",
    indexes = {
        @Index(name = "idx_ss_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_ss_student", columnList = "student_profile_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentScholarship extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "scholarship_type", nullable = false, length = 30)
    private ScholarshipType scholarshipType;

    @Column(name = "scholarship_name", length = 200)
    private String scholarshipName;

    /** PERCENTAGE | FLAT */
    @Column(name = "discount_mode", length = 15)
    private String discountMode;

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "concession_reason", length = 500)
    private String concessionReason;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    /** PENDING | APPROVED | REJECTED */
    @Column(name = "approval_status", length = 15)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "academic_session", length = 20)
    private String academicSession;
}
