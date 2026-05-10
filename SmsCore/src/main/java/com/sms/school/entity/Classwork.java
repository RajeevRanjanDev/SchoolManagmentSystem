package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * In-class work recorded by a teacher for a section.
 */
@Entity
@Table(name = "classwork",
        indexes = @Index(name = "idx_cw_section_date", columnList = "section_id, classwork_date"))
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
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "classwork_date", nullable = false)
    private LocalDate classworkDate;

    @Column(name = "attachment_url")
    private String attachmentUrl;
}
