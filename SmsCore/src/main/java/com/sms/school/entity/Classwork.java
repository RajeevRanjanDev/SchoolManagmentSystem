package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * In-class activity / lesson record created by a teacher for a section.
 * Distinct from Homework (which is take-home work).
 */
@Entity
@Table(name = "classwork",
        indexes = {
                @Index(name = "idx_cw_section_date", columnList = "section_id, classwork_date"),
                @Index(name = "idx_classwork_teacher", columnList = "school_id, teacher_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classwork extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    /** The assignment row that authorised this entry (validates teacher access). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private TeacherAssignment assignment;

    /** Structured subject FK (preferred for new records). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    /** Legacy free-text subject kept for backward compat. */
    @Column(name = "subject")
    private String subjectText;

    @Column(name = "academic_year")
    private String academicYear;

    /** Lesson topic / heading. */
    @Column(name = "topic")
    private String topic;

    /** Legacy title kept for backward compat. */
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "classwork_date", nullable = false)
    private LocalDate classworkDate;

    @Column(name = "attachment_url")
    private String attachmentUrl;
}
