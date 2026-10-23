package com.sms.school.entity.employee;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import com.sms.school.entity.SchoolClass;
import com.sms.school.entity.Section;
import com.sms.school.entity.Subject;
import com.sms.school.entity.academic.AcademicBatch;
import com.sms.school.entity.academic.AcademicProgram;
import com.sms.school.entity.academic.AcademicSemester;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Unified academic assignment for all institution types.
 *
 * School   : employee → class + section + subject
 * College  : employee → program + semester + subject + department
 * Coaching : employee → batch + subject
 */
@Entity
@Table(name = "employee_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmployeeAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /**
     * CLASS_SECTION | PROGRAM_SEMESTER | BATCH_COURSE | ADMIN | COORDINATOR
     */
    @Column(name = "assignment_type", nullable = false, length = 30)
    private String assignmentType;

    // ── School ─────────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private SchoolClass schoolClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    // ── College / University ───────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private AcademicProgram program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id")
    private AcademicSemester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private EmployeeDepartment department;

    // ── Coaching / Training ────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private AcademicBatch batch;

    // ── Shared ─────────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "academic_session", length = 20)
    private String academicSession;

    @Column(name = "is_class_teacher")
    @Builder.Default
    private boolean classTeacher = false;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
