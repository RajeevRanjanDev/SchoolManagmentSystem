package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A parent's or student's submission for a homework assignment.
 */
@Entity
@Table(
    name = "homework_submissions",
    indexes = {
        @Index(name = "idx_hws_homework", columnList = "school_id,homework_id"),
        @Index(name = "idx_hws_student",  columnList = "school_id,student_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkSubmission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /** URL of the uploaded file (photo / PDF) */
    @Column(name = "submission_url", columnDefinition = "TEXT")
    private String submissionUrl;

    /** Optional text answer */
    @Column(name = "text_response", columnDefinition = "TEXT")
    private String textResponse;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    /** SUBMITTED | LATE | REVIEWED | GRADED */
    @Column(name = "status", nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "grade")
    private String grade;

    @Column(name = "teacher_remarks")
    private String teacherRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
