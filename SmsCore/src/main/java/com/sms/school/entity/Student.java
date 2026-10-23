package com.sms.school.entity;

import com.sms.school.entity.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a student enrolled at a school.
 * Students do not have their own login; parents log in on their behalf.
 */
@Entity
@Table(
        name = "students",
        indexes = {
                @Index(name = "idx_student_school", columnList = "school_id"),
                @Index(name = "idx_student_admission", columnList = "admission_number")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    /** Unique roll/admission number within the school */
    @Column(name = "admission_number", nullable = false)
    private String admissionNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(name = "address")
    private String address;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    /** Contact mobile number of the student (optional) */
    @Column(name = "mobile")
    private String mobile;

    /** Contact email of the student (optional) */
    @Column(name = "email")
    private String email;

    /** Date the student joined this school */
    @Column(name = "joining_date")
    private LocalDate joiningDate;

    /**
     * ACTIVE | INACTIVE | TRANSFERRED | GRADUATED | EXPELLED
     * is_active column kept for backward compatibility.
     */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Legacy single-parent FK — kept for backward compatibility.
     *  Use student_parent_mappings for the full many-to-many relationship. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Parent parent;

    /** Transport route assigned to this student (nullable = no transport) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transport_route_id")
    private TransportRoute transportRoute;

    /** All parent/guardian links for this student (many-to-many) */
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentParentMapping> parentMappings = new ArrayList<>();
}
