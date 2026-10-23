package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Platform-level subscription plan definition.
 * Not scoped to a school — managed only by SUPER_ADMIN.
 */
@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan extends BaseEntity {

    @Column(name = "plan_code", nullable = false, unique = true)
    private String planCode;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "description")
    private String description;

    @Column(name = "max_students", nullable = false)
    @Builder.Default
    private int maxStudents = 500;

    @Column(name = "max_teachers", nullable = false)
    @Builder.Default
    private int maxTeachers = 50;

    @Column(name = "max_parents", nullable = false)
    @Builder.Default
    private int maxParents = 1000;

    @Column(name = "max_storage_gb", nullable = false)
    @Builder.Default
    private int maxStorageGb = 5;

    /** JSON feature flags, e.g. {"homework":true,"analytics":false} */
    @Column(name = "features", columnDefinition = "text")
    @Builder.Default
    private String features = "{}";

    @Column(name = "monthly_price", nullable = false)
    @Builder.Default
    private java.math.BigDecimal monthlyPrice = java.math.BigDecimal.ZERO;

    @Column(name = "annual_price", nullable = false)
    @Builder.Default
    private java.math.BigDecimal annualPrice = java.math.BigDecimal.ZERO;

    @Column(name = "trial_days", nullable = false)
    @Builder.Default
    private int trialDays = 30;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "ACTIVE";
}
