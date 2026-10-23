package com.sms.school.entity.academic;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import com.sms.school.entity.employee.EmployeeDepartment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Academic program for College / University institution types.
 * Examples: B.Tech (CSE), MBA, M.Sc Physics
 */
@Entity
@Table(name = "academic_programs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicProgram extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private EmployeeDepartment department;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "code", length = 30)
    private String code;

    /** DIPLOMA | BACHELORS | MASTERS | PHD | CERTIFICATE */
    @Column(name = "degree_type", length = 50)
    private String degreeType;

    @Column(name = "duration_years")
    private Integer durationYears;

    @Column(name = "total_semesters")
    private Integer totalSemesters;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AcademicSemester> semesters = new ArrayList<>();
}
