package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "student_hostel_details",
    indexes = {
        @Index(name = "idx_shd_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_shd_student", columnList = "student_profile_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentHostelDetail extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false, unique = true)
    private StudentProfile studentProfile;

    @Column(name = "hostel_required", nullable = false)
    @Builder.Default
    private boolean hostelRequired = false;

    @Column(name = "hostel_name", length = 100)
    private String hostelName;

    @Column(name = "room_number", length = 20)
    private String roomNumber;

    @Column(name = "bed_number", length = 10)
    private String bedNumber;

    /** BOYS | GIRLS | MIXED */
    @Column(name = "hostel_type", length = 10)
    private String hostelType;
}
