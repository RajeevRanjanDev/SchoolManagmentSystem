package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import com.sms.school.entity.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Master student profile — institution-agnostic.
 * Replaces the simple Student entity for the full admission module.
 * Every child table joins back here via student_profile_id.
 */
@Entity
@Table(
    name = "student_profiles",
    indexes = {
        @Index(name = "idx_sp_tenant",       columnList = "tenant_id"),
        @Index(name = "idx_sp_admission_no", columnList = "tenant_id,admission_number"),
        @Index(name = "idx_sp_aadhaar",      columnList = "aadhaar_number"),
        @Index(name = "idx_sp_mobile",       columnList = "mobile"),
        @Index(name = "idx_sp_status",       columnList = "lifecycle_status")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_sp_admission_per_tenant",
                          columnNames = {"tenant_id", "admission_number"}),
        @UniqueConstraint(name = "uq_sp_enrollment_per_tenant",
                          columnNames = {"tenant_id", "enrollment_number"})
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfile extends BaseEntity {

    // ── Tenant / School ───────────────────────────────────────────────
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    /** The student's own login account (username = admission number). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private com.sms.school.entity.User user;

    // ── Identity ──────────────────────────────────────────────────────
    /** System-generated readable ID e.g. STU-2024-000001 */
    @Column(name = "student_code", nullable = false, updatable = false, length = 30)
    private String studentCode;

    @Column(name = "admission_number", length = 50)
    private String admissionNumber;

    @Column(name = "enrollment_number", length = 50)
    private String enrollmentNumber;

    // ── Personal Info ─────────────────────────────────────────────────
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private Gender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    /** SC/ST/OBC/GEN/EWS/NRI/Other */
    @Column(name = "category", length = 30)
    private String category;

    @Column(name = "nationality", length = 60)
    private String nationality;

    @Column(name = "religion", length = 60)
    private String religion;

    @Column(name = "mother_tongue", length = 60)
    private String motherTongue;

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(name = "mobile", length = 15)
    private String mobile;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    // ── Lifecycle ─────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 30)
    @Builder.Default
    private StudentLifecycleStatus lifecycleStatus = StudentLifecycleStatus.APPLICANT;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "admission_type", length = 30)
    private AdmissionType admissionType;

    @Column(name = "campus_id")
    private Long campusId;

    @Column(name = "previous_institution", length = 200)
    private String previousInstitution;

    @Column(name = "previous_qualification", length = 200)
    private String previousQualification;

    // ── Relations ─────────────────────────────────────────────────────
    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentAcademicProfile academicProfile;

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentGuardian> guardians = new ArrayList<>();

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentAddress> addresses = new ArrayList<>();

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentMedicalDetail medicalDetail;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentTransportDetail transportDetail;

    @OneToOne(mappedBy = "studentProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentHostelDetail hostelDetail;

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentDocument> documents = new ArrayList<>();

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentScholarship> scholarships = new ArrayList<>();

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentStatusHistory> statusHistory = new ArrayList<>();

    // ── Convenience ───────────────────────────────────────────────────
    public String getFullName() {
        StringBuilder sb = new StringBuilder(firstName);
        if (middleName != null && !middleName.isBlank()) sb.append(' ').append(middleName);
        sb.append(' ').append(lastName);
        return sb.toString();
    }
}
