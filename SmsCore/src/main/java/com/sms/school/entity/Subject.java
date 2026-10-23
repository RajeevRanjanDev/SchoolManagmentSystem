package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A subject taught in the school (Math, Science, English, …).
 * Replaces free-text subject strings across homework/exam/timetable tables.
 */
@Entity
@Table(name = "subjects",
        indexes = @Index(name = "idx_subject_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "subject_code")
    private String subjectCode;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
