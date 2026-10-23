package com.sms.school.entity.template;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.School;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_templates",
       uniqueConstraints = @UniqueConstraint(columnNames = "tenant_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private School tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false)
    private InstitutionTemplate template;

    @Column(name = "applied_at", nullable = false)
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "applied_by", length = 100)
    private String appliedBy;

    /** APPLIED | CUSTOMIZED | FAILED */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "APPLIED";

    @Column(name = "error_log", columnDefinition = "TEXT")
    private String errorLog;
}
