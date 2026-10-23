package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "template_roles",
       uniqueConstraints = @UniqueConstraint(columnNames = {"template_id", "role_name"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateRole extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private InstitutionTemplate template;

    @Column(name = "role_name", nullable = false, length = 100)
    private String roleName;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_system_role", nullable = false)
    @Builder.Default
    private boolean systemRole = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "templateRole", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TemplatePermission> permissions = new ArrayList<>();
}
