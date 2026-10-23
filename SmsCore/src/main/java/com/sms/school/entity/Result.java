package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Exam result for a student in a specific exam.
 */
@Entity
@Table(name = "results",
        indexes = {
                @Index(name = "idx_result_student", columnList = "student_id"),
                @Index(name = "idx_result_exam", columnList = "exam_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Result extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "marks_obtained", nullable = false)
    private Double marksObtained;

    @Column(name = "grade")
    private String grade;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "is_published", nullable = false)
    private boolean published = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by_teacher_id")
    private Teacher enteredByTeacher;
}
