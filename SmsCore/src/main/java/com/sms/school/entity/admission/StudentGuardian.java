package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.GuardianRelation;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Supports unlimited guardians per student.
 * isPrimary flags the main emergency contact.
 */
@Entity
@Table(
    name = "student_guardians",
    indexes = {
        @Index(name = "idx_sg_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_sg_student", columnList = "student_profile_id"),
        @Index(name = "idx_sg_mobile",  columnList = "mobile")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentGuardian extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation", nullable = false, length = 20)
    private GuardianRelation relation;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "mobile", length = 15)
    private String mobile;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "occupation", length = 100)
    private String occupation;

    @Column(name = "annual_income", precision = 12, scale = 2)
    private BigDecimal annualIncome;

    @Column(name = "qualification", length = 100)
    private String qualification;

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    /** True = primary emergency contact */
    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean primary = false;

    /** True = this guardian has a portal login */
    @Column(name = "has_portal_access", nullable = false)
    @Builder.Default
    private boolean hasPortalAccess = false;
}
