package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.InstitutionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Institution-type-aware academic profile.
 * Fields are populated selectively based on InstitutionType.
 *
 * SCHOOL          → class_id, section_id, roll_number, academic_session
 * COLLEGE/UNIV    → program, course, department, branch, semester, year,
 *                   registration_number, university_roll_number
 * COACHING/TRAIN  → batch_id, batch_start_date, batch_end_date
 */
@Entity
@Table(
    name = "student_academic_profiles",
    indexes = {
        @Index(name = "idx_sap_tenant",    columnList = "tenant_id"),
        @Index(name = "idx_sap_student",   columnList = "student_profile_id"),
        @Index(name = "idx_sap_session",   columnList = "tenant_id,academic_session"),
        @Index(name = "idx_sap_class",     columnList = "class_id"),
        @Index(name = "idx_sap_batch",     columnList = "batch_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentAcademicProfile extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false, unique = true)
    private StudentProfile studentProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "institution_type", nullable = false, length = 30)
    private InstitutionType institutionType;

    // ── Common ────────────────────────────────────────────────────────
    @Column(name = "academic_session", length = 20)   // e.g. "2024-2025"
    private String academicSession;

    // ── School fields ─────────────────────────────────────────────────
    @Column(name = "class_id")
    private Long classId;

    @Column(name = "class_name", length = 50)
    private String className;

    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "section_name", length = 20)
    private String sectionName;

    @Column(name = "roll_number", length = 20)
    private String rollNumber;

    // ── College / University fields ───────────────────────────────────
    @Column(name = "program", length = 100)           // B.Tech, M.Sc, MBA
    private String program;

    @Column(name = "course", length = 100)            // Computer Science
    private String course;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "branch", length = 100)            // AI & ML, Mechanical
    private String branch;

    @Column(name = "semester")
    private Integer semester;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "university_roll_number", length = 50)
    private String universityRollNumber;

    // ── Coaching / Training fields ────────────────────────────────────
    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "batch_name", length = 100)
    private String batchName;

    @Column(name = "batch_start_date")
    private LocalDate batchStartDate;

    @Column(name = "batch_end_date")
    private LocalDate batchEndDate;
}
