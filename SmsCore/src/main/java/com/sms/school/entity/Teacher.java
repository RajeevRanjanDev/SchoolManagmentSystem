package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Teacher profile linked to a User login account.
 */
@Entity
@Table(name = "teachers",
        indexes = @Index(name = "idx_teacher_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "employee_code", unique = true)
    private String employeeCode;

    @Column(name = "qualification")
    private String qualification;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "email")
    private String email;

    /** ACTIVE | INACTIVE | ON_LEAVE | RESIGNED */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    /**
     * Legacy scalar flag — kept for backward compat.
     * Authoritative class-teacher assignment lives in TeacherAssignment.isClassTeacher.
     */
    @Column(name = "is_class_teacher", nullable = false)
    private boolean classTeacher = false;
}
