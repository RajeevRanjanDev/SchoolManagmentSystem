package com.sms.school.entity;

import com.sms.school.entity.enums.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Maps a student to a class+section for a given academic year.
 * A student can be in different classes each year (promotion).
 * Historical rows are kept — only one row per student per year has status=ACTIVE.
 */
@Entity
@Table(
        name = "student_class_mapping",
        indexes = {
                @Index(name = "idx_scm_student", columnList = "student_id"),
                @Index(name = "idx_scm_section", columnList = "section_id"),
                @Index(name = "idx_scm_student_year", columnList = "student_id,academic_year")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentClassMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "roll_number")
    private String rollNumber;

    /** Legacy boolean kept for DB compat. Use `status` for business logic. */
    @Column(name = "is_current", nullable = false)
    private boolean current = true;

    /**
     * ACTIVE     → student is currently in this class/section this year
     * PROMOTED   → end-of-year, moved to next class
     * TRANSFERRED→ same year, moved to another section
     * WITHDRAWN  → left school
     * GRADUATED  → completed final year
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    /** Optional remarks for promotion/transfer/withdrawal */
    @Column(name = "remarks")
    private String remarks;
}
