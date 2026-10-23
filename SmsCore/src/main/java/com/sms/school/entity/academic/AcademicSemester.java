package com.sms.school.entity.academic;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "academic_semesters",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"tenant_id", "program_id", "semester_number", "academic_session"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicSemester extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id", nullable = false)
    private AcademicProgram program;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber;

    @Column(name = "academic_session", length = 20)
    private String academicSession;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
