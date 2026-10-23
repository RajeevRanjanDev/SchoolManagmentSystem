package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "student_medical_details",
    indexes = {
        @Index(name = "idx_smd_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_smd_student", columnList = "student_profile_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentMedicalDetail extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false, unique = true)
    private StudentProfile studentProfile;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "medical_conditions", columnDefinition = "TEXT")
    private String medicalConditions;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "disability_type", length = 100)
    private String disabilityType;

    @Column(name = "disability_details", columnDefinition = "TEXT")
    private String disabilityDetails;

    @Column(name = "disability_percentage")
    private Integer disabilityPercentage;

    @Column(name = "emergency_medical_notes", columnDefinition = "TEXT")
    private String emergencyMedicalNotes;

    @Column(name = "family_doctor_name", length = 150)
    private String familyDoctorName;

    @Column(name = "family_doctor_mobile", length = 15)
    private String familyDoctorMobile;
}
