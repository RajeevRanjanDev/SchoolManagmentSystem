package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Stores current and permanent address separately.
 * addressType: CURRENT | PERMANENT
 */
@Entity
@Table(
    name = "student_addresses",
    indexes = {
        @Index(name = "idx_sa_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_sa_student", columnList = "student_profile_id"),
        @Index(name = "idx_sa_pincode", columnList = "pincode")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentAddress extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    /** CURRENT | PERMANENT */
    @Column(name = "address_type", nullable = false, length = 15)
    private String addressType;

    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 80)
    @Builder.Default
    private String country = "India";

    @Column(name = "pincode", length = 10)
    private String pincode;
}
