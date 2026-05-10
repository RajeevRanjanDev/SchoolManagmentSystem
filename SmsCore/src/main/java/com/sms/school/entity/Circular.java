package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Official circular/announcement published by the school.
 * Can target all students, specific classes, or parents.
 */
@Entity
@Table(name = "circulars",
        indexes = @Index(name = "idx_circular_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Circular extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "published_date", nullable = false)
    private LocalDate publishedDate;

    /** null = school-wide; set class_id to target a specific class */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_class_id")
    private SchoolClass targetClass;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "is_published", nullable = false)
    private boolean published = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by_user_id")
    private User publishedBy;
}
