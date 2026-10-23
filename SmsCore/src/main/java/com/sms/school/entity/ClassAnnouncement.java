package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Teacher-to-class/section announcements — distinct from school-wide Circulars.
 * A class teacher or subject teacher posts notices visible only to their section.
 */
@Entity
@Table(name = "class_announcements",
        indexes = {
                @Index(name = "idx_ca_section", columnList = "school_id, section_id"),
                @Index(name = "idx_ca_class",   columnList = "school_id, class_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassAnnouncement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    /** NULL = entire class, non-null = specific section only. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    /** Non-null = notice targeted at a single student (within the section). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
