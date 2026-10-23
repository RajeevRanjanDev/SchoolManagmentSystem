package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "template_permissions",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"template_id", "template_role_id", "resource", "action"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplatePermission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private InstitutionTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_role_id", nullable = false)
    private TemplateRole templateRole;

    @Column(name = "resource", nullable = false, length = 100)
    private String resource;

    /** CREATE | READ | UPDATE | DELETE | APPROVE | EXPORT */
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
