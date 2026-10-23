package com.sms.school.entity.admission;

import com.sms.school.entity.BaseEntity;
import com.sms.school.entity.enums.StudentLifecycleStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Immutable audit trail of every lifecycle state transition.
 */
@Entity
@Table(
    name = "student_status_history",
    indexes = {
        @Index(name = "idx_ssh_tenant",  columnList = "tenant_id"),
        @Index(name = "idx_ssh_student", columnList = "student_profile_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentStatusHistory extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private StudentLifecycleStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private StudentLifecycleStatus toStatus;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "remarks", length = 500)
    private String remarks;

    /** e.g. "PROMOTE", "TRANSFER", "DROPOUT", "ADMIT" */
    @Column(name = "action", length = 50)
    private String action;

    @Column(name = "effective_date")
    private java.time.LocalDate effectiveDate;
}
