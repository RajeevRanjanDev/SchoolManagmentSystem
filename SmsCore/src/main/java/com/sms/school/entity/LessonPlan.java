package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "lesson_plans",
       indexes = {
           @Index(name = "idx_lp_teacher", columnList = "school_id, teacher_id, academic_year"),
           @Index(name = "idx_lp_section", columnList = "school_id, section_id, subject_id")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LessonPlan extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    /** ANNUAL | MONTHLY | WEEKLY | DAILY */
    @Column(name = "plan_type", nullable = false)
    private String planType;

    @Column(name = "plan_name")
    private String planName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** DRAFT | APPROVED | IN_PROGRESS | COMPLETED */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "DRAFT";

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @OneToMany(mappedBy = "lessonPlan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<LessonPlanTopic> topics = new java.util.ArrayList<>();
}
