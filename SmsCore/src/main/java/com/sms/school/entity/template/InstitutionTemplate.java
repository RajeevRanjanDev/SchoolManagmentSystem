package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.InstitutionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "institution_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstitutionTemplate extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "institution_type", nullable = false, unique = true, length = 30)
    private InstitutionType institutionType;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TemplateRole> roles = new ArrayList<>();

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TemplateAcademicStructure> academicStructures = new ArrayList<>();

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TemplateFeeStructure> feeStructures = new ArrayList<>();
}
