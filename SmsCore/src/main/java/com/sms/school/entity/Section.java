package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * A section within a class (e.g. "A", "B", "C").
 */
@Entity
@Table(name = "sections",
        indexes = @Index(name = "idx_section_class", columnList = "class_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @Column(name = "name", nullable = false)
    private String name;    // e.g. "A", "B"

    /** The class teacher assigned to this section */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_teacher_id")
    private Teacher classTeacher;

    @Column(name = "max_capacity")
    private Integer maxCapacity;
}
