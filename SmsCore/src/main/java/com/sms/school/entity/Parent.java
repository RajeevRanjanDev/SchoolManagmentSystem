package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Parent/guardian profile.
 * user_id is nullable — admin can create the profile before the parent has a login.
 * One parent can be linked to multiple children via StudentParentMapping.
 */
@Entity
@Table(name = "parents",
        indexes = {
            @Index(name = "idx_parent_school",   columnList = "school_id"),
            @Index(name = "idx_parent_user",     columnList = "user_id"),
            @Index(name = "idx_parent_mobile",   columnList = "mobile")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    /**
     * Nullable: parent may exist before being invited to create a login.
     * When the parent registers, this is set to their User record.
     */
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // ── Direct identity fields (required even without a User login) ─────

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "mobile")
    private String mobile;

    @Column(name = "email")
    private String email;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    // ── Additional info ─────────────────────────────────────────────────

    @Column(name = "occupation")
    private String occupation;

    /** Legacy single-relation field from V1. Use StudentParentMapping.relationshipType for full mapping. */
    @Column(name = "relation")
    private String relation;    // FATHER, MOTHER, GUARDIAN

    @Column(name = "alternate_phone")
    private String alternatePhone;

    /** ACTIVE | INACTIVE */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    /** Convenience: get display name — from User if linked, otherwise direct fields */
    @Transient
    public String getFullName() {
        if (user != null) {
            return user.getFullName();
        }
        String fn = firstName != null ? firstName : "";
        String ln = lastName  != null ? lastName  : "";
        return (fn + " " + ln).trim();
    }

    /** Student mappings for this parent */
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentParentMapping> studentMappings = new ArrayList<>();
}
