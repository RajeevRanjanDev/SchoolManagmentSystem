package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "template_fee_structures",
       uniqueConstraints = @UniqueConstraint(columnNames = {"template_id", "fee_component"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TemplateFeeStructure extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private InstitutionTemplate template;

    /** TUITION_FEE | EXAM_FEE | TRANSPORT_FEE | HOSTEL_FEE | LIBRARY_FEE | COURSE_FEE | ... */
    @Column(name = "fee_component", nullable = false, length = 100)
    private String feeComponent;

    @Column(name = "label", nullable = false, length = 150)
    private String label;

    /** MONTHLY | QUARTERLY | ANNUAL | ONE_TIME */
    @Column(name = "frequency", nullable = false, length = 30)
    private String frequency;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private boolean mandatory = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
