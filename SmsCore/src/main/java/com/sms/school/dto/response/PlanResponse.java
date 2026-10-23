package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** A subscription plan, shown to SUPER_ADMIN when assigning or comparing plans. */
@Data
@Builder
public class PlanResponse {
    private Long id;
    private String planCode;
    private String planName;
    private String description;
    private int maxStudents;
    private int maxTeachers;
    private int maxParents;
    private int maxStorageGb;
    private String features;
    private BigDecimal monthlyPrice;
    private BigDecimal annualPrice;
    private int trialDays;
    private String status;
}
