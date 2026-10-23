package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * An exam scheduled for a class/section.
 * E.g. "Mid-Term Maths – Class 7A – 12 Nov 2024"
 */
@Entity
@Table(name = "exams",
        indexes = @Index(name = "idx_exam_section", columnList = "section_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "exam_name", nullable = false)
    private String examName;   // e.g. "Mid-Term", "Final Term"

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "total_marks", nullable = false)
    private Double totalMarks;

    @Column(name = "passing_marks")
    private Double passingMarks;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;
}
