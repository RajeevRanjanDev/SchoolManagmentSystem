package com.sms.school.entity.employee;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "employee_departments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeDepartment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", length = 30)
    private String code;

    /** Set after Employee is created — circular ref uses DEFERRABLE FK in DDL */
    @Column(name = "head_employee_id")
    private Long headEmployeeId;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
