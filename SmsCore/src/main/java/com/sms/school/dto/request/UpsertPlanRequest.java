package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/** SUPER_ADMIN creates or updates a subscription plan (SA-041 / SA-049). */
@Data
public class UpsertPlanRequest {

    /** Null = create a new plan (code must be unique); set = edit the plan with this id. */
    private Long id;

    @NotBlank(message = "Plan code is required")
    private String planCode;

    @NotBlank(message = "Plan name is required")
    private String planName;

    private String description;
    private Integer maxStudents;
    private Integer maxTeachers;
    private Integer maxParents;
    private Integer maxStorageGb;

    /** JSON of enabled module flags, e.g. {"transport":true,"analytics":false}. */
    private String features;

    private BigDecimal monthlyPrice;
    private BigDecimal annualPrice;
    private Integer trialDays;
    private String status;               // ACTIVE | INACTIVE
}
