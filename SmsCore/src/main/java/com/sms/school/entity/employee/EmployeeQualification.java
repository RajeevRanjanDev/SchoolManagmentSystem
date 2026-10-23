package com.sms.school.entity.employee;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "employee_qualifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeQualification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "degree", nullable = false, length = 150)
    private String degree;

    @Column(name = "field_of_study", length = 150)
    private String fieldOfStudy;

    @Column(name = "institution", length = 200)
    private String institution;

    @Column(name = "board_university", length = 200)
    private String boardUniversity;

    @Column(name = "passing_year")
    private Integer passingYear;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "grade", length = 10)
    private String grade;

    @Column(name = "is_highest")
    @Builder.Default
    private boolean highest = false;
}
