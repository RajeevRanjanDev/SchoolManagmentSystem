package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * A simple per-day entry of HOMEWORK or CLASSWORK for a class-section.
 * No subject, no teacher requirement — just a description for a given date,
 * posted by a class teacher or admin. One entry per section + date + type.
 */
@Entity
@Table(name = "daily_work",
        indexes = {
                @Index(name = "idx_dw_section_date", columnList = "section_id, work_date"),
                @Index(name = "idx_dw_school", columnList = "school_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyWork extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    /** HOMEWORK or CLASSWORK */
    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Who posted it (admin or class teacher) — stored as a name for display. */
    @Column(name = "created_by_name")
    private String createdByName;
}
