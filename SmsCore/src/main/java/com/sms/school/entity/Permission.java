package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Fine-grained permission (e.g. "MARK_ATTENDANCE", "VIEW_RESULTS").
 * Permissions are grouped under roles via the role_permissions join table.
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission extends BaseEntity {

    /** Unique permission identifier – used in @PreAuthorize expressions */
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description")
    private String description;

    /** Groups related permissions (e.g. "STUDENT", "FEE", "LIBRARY") */
    @Column(name = "module")
    private String module;
}
