package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A class/grade within a school (e.g. "Class 5", "Grade 10").
 * Named SchoolClass to avoid conflict with java.lang.Class.
 */
@Entity
@Table(name = "classes",
        indexes = @Index(name = "idx_class_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClass extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "name", nullable = false)
    private String name;   // e.g. "Class 5"

    @Column(name = "numeric_name")
    private Integer numericName; // e.g. 5  – useful for sorting

    @Column(name = "academic_year", nullable = false)
    private String academicYear; // e.g. "2024-2025"

    /** ACTIVE or INACTIVE. Deactivated classes are hidden from day-to-day use but preserved. */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
}
