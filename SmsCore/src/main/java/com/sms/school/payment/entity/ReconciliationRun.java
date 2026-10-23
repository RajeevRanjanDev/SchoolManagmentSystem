package com.sms.school.payment.entity;

import com.sms.school.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A single reconciliation run and its summary totals. */
@Entity
@Table(name = "reconciliation_runs", indexes = @Index(name = "idx_recon_run_school", columnList = "school_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReconciliationRun extends BaseEntity {

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "period_from")
    private LocalDate periodFrom;

    @Column(name = "period_to")
    private LocalDate periodTo;

    /** SCHEDULED | MANUAL */
    @Column(name = "source", nullable = false)
    @Builder.Default
    private String source = "MANUAL";

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "payments_checked")
    private int paymentsChecked;

    @Column(name = "allocations_repaired")
    private int allocationsRepaired;

    @Column(name = "exceptions_opened")
    private int exceptionsOpened;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "RUNNING";       // RUNNING | COMPLETED | FAILED
}
