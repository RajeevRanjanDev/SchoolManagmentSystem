package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Many-to-many mapping between students and parents.
 * A student can have FATHER + MOTHER + GUARDIAN.
 * A parent can be linked to multiple children.
 */
@Entity
@Table(
    name = "student_parent_mappings",
    indexes = {
        @Index(name = "idx_spm_student", columnList = "school_id,student_id"),
        @Index(name = "idx_spm_parent",  columnList = "school_id,parent_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentParentMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    private Parent parent;

    /** FATHER, MOTHER, GUARDIAN, STEP_PARENT, SIBLING_GUARDIAN */
    @Column(name = "relationship_type", nullable = false)
    private String relationshipType;

    /** If true, this parent is the primary point of contact */
    @Column(name = "is_primary_contact", nullable = false)
    private boolean primaryContact = false;

    /** If true, this parent should be contacted in emergencies */
    @Column(name = "is_emergency_contact", nullable = false)
    private boolean emergencyContact = false;

    /** If true, this parent is authorized to pick up the child */
    @Column(name = "can_pickup", nullable = false)
    private boolean canPickup = true;
}
