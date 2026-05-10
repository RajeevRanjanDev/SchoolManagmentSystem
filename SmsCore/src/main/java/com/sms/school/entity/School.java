package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a school/institute registered on the platform.
 * This is the TENANT root entity – all other data references school_id.
 */
@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    /** Unique short code used in tenant identification (e.g. "DPS-NOIDA") */
    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    @Column(name = "logo_url")
    private String logoUrl;

    /** Whether this school account is active on the platform */
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Academic year e.g. "2024-2025" */
    @Column(name = "current_academic_year")
    private String currentAcademicYear;
}
