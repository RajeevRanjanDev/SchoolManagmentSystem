package com.sms.school.entity.academic;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import com.sms.school.entity.employee.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Batch for Coaching / Training institution types.
 * Examples: JEE-2025-A, Java Full Stack Batch 3
 */
@Entity
@Table(name = "academic_batches",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicBatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", length = 30)
    private String code;

    @Column(name = "course_name", length = 200)
    private String courseName;

    /** REGULAR | WEEKEND | ONLINE | CRASH_COURSE */
    @Column(name = "batch_type", length = 30)
    private String batchType;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "enrolled_count")
    @Builder.Default
    private Integer enrolledCount = 0;

    @Column(name = "timing", length = 100)
    private String timing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Employee faculty;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
