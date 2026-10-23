package com.sms.school.entity.employee;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import com.sms.school.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Unified employee entity for all institution types.
 * Replaces the school-specific Teacher entity for new tenants.
 * Existing teachers table is preserved for backward compatibility.
 */
@Entity
@Table(name = "employees",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"tenant_id", "employee_code"}),
           @UniqueConstraint(columnNames = {"tenant_id", "aadhaar_number"}),
           @UniqueConstraint(columnNames = {"tenant_id", "official_email"})
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Employee extends BaseEntity {

    // ── Identity ────────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "employee_code", nullable = false, length = 30)
    private String employeeCode;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(name = "nationality", length = 50)
    @Builder.Default
    private String nationality = "Indian";

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(name = "pan_number", length = 10)
    private String panNumber;

    @Column(name = "mobile", length = 15)
    private String mobile;

    @Column(name = "alternate_mobile", length = 15)
    private String alternateMobile;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "official_email", length = 150)
    private String officialEmail;

    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    private String profilePhotoUrl;

    // ── Employment ──────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "designation_id")
    private EmployeeDesignation designation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private EmployeeDepartment department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private Employee reportingManager;

    /** FULL_TIME | PART_TIME | CONTRACT | VISITING | INTERN */
    @Column(name = "employee_type", nullable = false, length = 30)
    @Builder.Default
    private String employeeType = "FULL_TIME";

    /** ACTIVE | ON_LEAVE | RESIGNED | TERMINATED | RETIRED */
    @Column(name = "employment_status", nullable = false, length = 20)
    @Builder.Default
    private String employmentStatus = "ACTIVE";

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(name = "confirmation_date")
    private LocalDate confirmationDate;

    @Column(name = "resignation_date")
    private LocalDate resignationDate;

    @Column(name = "last_working_date")
    private LocalDate lastWorkingDate;

    // ── System user link ────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // ── Address ─────────────────────────────────────────────────────────────────

    @Column(name = "current_address", columnDefinition = "TEXT")
    private String currentAddress;

    @Column(name = "permanent_address", columnDefinition = "TEXT")
    private String permanentAddress;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 10)
    private String pincode;

    // ── Bank details (encrypted at application layer before persist) ────────────

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "ifsc_code", length = 15)
    private String ifscCode;

    // ── Relationships ────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmployeeAssignment> assignments = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmployeeQualification> qualifications = new ArrayList<>();

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EmployeeDocument> documents = new ArrayList<>();

    // ── Helpers ─────────────────────────────────────────────────────────────────

    public String getFullName() {
        StringBuilder sb = new StringBuilder(firstName);
        if (middleName != null && !middleName.isBlank()) sb.append(' ').append(middleName);
        sb.append(' ').append(lastName);
        return sb.toString();
    }

    public boolean isActive() {
        return "ACTIVE".equals(employmentStatus);
    }
}
