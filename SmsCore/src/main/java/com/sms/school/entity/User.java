package com.sms.school.entity;

import com.sms.school.entity.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Central user account for every person on the platform
 * (admin, teacher, parent – students do not log in directly).
 *
 * Multi-tenancy: every user belongs to exactly one school,
 * except SUPER_ADMIN whose school_id is null.
 */
@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_user_email", columnList = "email"),
                @Index(name = "idx_user_school", columnList = "school_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    /** Nullable only for SUPER_ADMIN – all other users must belong to a school */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    /**
     * Login identifier. Admins/super-admins log in with their email, so for them
     * this stays null (the email is their login). Students log in with their
     * admission number and teachers with a generated code (schoolCode+TE+year+seq)
     * — that value is stored here. Globally unique (embeds the school code).
     */
    @Column(name = "username", unique = true)
    private String username;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    /**
     * Email is a contact address. Not globally unique, so the same person can be
     * registered at more than one school (they log in with their per-school
     * username / admission number, not their email).
     */
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    /** BCrypt-hashed password */
    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "address")
    private String address;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Token used for password reset (stored temporarily) */
    @Column(name = "reset_token")
    private String resetToken;

    /**
     * User classification for quick filtering.
     * Values: "SUPER_ADMIN" | "SCHOOL_USER"
     * Avoids joining user_roles just to check if someone is platform-level.
     */
    @Column(name = "user_type", nullable = false)
    @Builder.Default
    private String userType = "SCHOOL_USER";

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /** Convenience helper used in the JWT filter */
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
