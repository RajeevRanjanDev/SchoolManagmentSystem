package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Maps one teacher to one subject in one section for an academic year.
 * <p>
 * One row = "Teacher T teaches Subject S in Section SEC (Class C) for Year Y"
 * <p>
 * A teacher may have MANY rows (multiple subjects, multiple sections).
 * Only one teacher per subject per section per year (enforced by DB unique index).
 * Only one class-teacher per section per year (enforced by partial unique index).
 */
@Entity
@Table(name = "teacher_assignments",
        indexes = {
                @Index(name = "idx_ta_teacher", columnList = "school_id, teacher_id, academic_year"),
                @Index(name = "idx_ta_section", columnList = "school_id, section_id, academic_year")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** e.g. "2025-26" */
    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    /**
     * TRUE if this teacher is the homeroom / class teacher for this section.
     * Only one ACTIVE row per section per year can have this flag set.
     */
    @Column(name = "is_class_teacher", nullable = false)
    private boolean classTeacher = false;

    /** ACTIVE | REMOVED */
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
