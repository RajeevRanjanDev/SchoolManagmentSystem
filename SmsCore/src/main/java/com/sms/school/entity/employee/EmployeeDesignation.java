package com.sms.school.entity.employee;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_designations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeDesignation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", length = 30)
    private String code;

    @Column(name = "grade_level")
    private Integer gradeLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private EmployeeDepartment department;
}
