package com.sms.school.entity;

import com.sms.school.entity.enums.InstitutionType;
import jakarta.persistence.*;
import lombok.*;

/**
 * Physical campus belonging to a tenant (school/group).
 *
 * Relationship:
 *   School (tenant) 1 → N Campus
 *   Campus  1 → N SchoolClass, Section, Employee, StudentProfile, Fee, Attendance
 *
 * campus_id = NULL on operational entities means "main/single campus" —
 * backward compatible with all existing single-campus tenants.
 *
 * Tenant-scoped users (campus_id = NULL in user_campus_scope) see ALL campuses.
 * Campus-scoped users see only their campus.
 */
@Entity
@Table(name = "campuses",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Campus extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /** Short unique code within tenant — e.g. "DPS-NOIDA", "IIT-DELHI-MAIN" */
    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 80)
    @Builder.Default
    private String country = "India";

    @Column(name = "pincode", length = 10)
    private String pincode;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "principal_name", length = 200)
    private String principalName;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    /** True for the primary/headquarters campus */
    @Column(name = "is_main_campus", nullable = false)
    @Builder.Default
    private boolean mainCampus = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * May differ from tenant's institution_type for mixed-type groups
     * (e.g. an education group running both schools and coaching centres).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "institution_type", length = 30)
    private InstitutionType institutionType;

    @Column(name = "current_academic_year", length = 20)
    private String currentAcademicYear;

    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "Asia/Kolkata";
}
