package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "template_academic_structures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateAcademicStructure extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private InstitutionTemplate template;

    /** CLASS_SECTION | PROGRAM_SEMESTER | BATCH_COURSE */
    @Column(name = "structure_type", nullable = false, length = 50)
    private String structureType;

    @Column(name = "level_name", nullable = false, length = 100)
    private String levelName;

    @Column(name = "supports_sections", nullable = false)
    @Builder.Default
    private boolean supportsSections = false;

    @Column(name = "supports_subjects", nullable = false)
    @Builder.Default
    private boolean supportsSubjects = true;

    @Column(name = "supports_programs", nullable = false)
    @Builder.Default
    private boolean supportsPrograms = false;

    @Column(name = "supports_departments", nullable = false)
    @Builder.Default
    private boolean supportsDepartments = false;

    @Column(name = "supports_semesters", nullable = false)
    @Builder.Default
    private boolean supportsSemesters = false;

    @Column(name = "supports_batches", nullable = false)
    @Builder.Default
    private boolean supportsBatches = false;

    @Column(name = "max_levels")
    private Integer maxLevels;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
}
