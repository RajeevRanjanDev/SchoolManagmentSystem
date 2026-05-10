package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Parent/guardian profile linked to a User login account.
 * One parent can have multiple children (students).
 */
@Entity
@Table(name = "parents",
        indexes = @Index(name = "idx_parent_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    /** The user login account for this parent */
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "relation")
    private String relation;    // FATHER, MOTHER, GUARDIAN

    @Column(name = "alternate_phone")
    private String alternatePhone;
}
