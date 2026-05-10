package com.sms.school.entity;

import com.sms.school.entity.enums.Gender;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** The parent/guardian linked to this student */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Parent parent;

    /** Transport route assigned to this student (nullable = no transport) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transport_route_id")
    private TransportRoute transportRoute;
}
