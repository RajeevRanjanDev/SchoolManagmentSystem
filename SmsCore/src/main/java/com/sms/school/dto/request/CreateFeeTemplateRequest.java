package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateFeeTemplateRequest {

    @NotBlank(message = "Template name is required")
    private String name;

    @NotBlank(message = "Fee type is required")
    private String feeType;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String frequency;         // MONTHLY | QUARTERLY | HALF_YEARLY | ANNUAL | ONE_TIME
    private Integer dueDayOfMonth;
    private Integer graceDays;

    private boolean lateFeeEnabled;
    private BigDecimal lateFeeAmount;
    private BigDecimal repeatedLateFeeAmount;

    private boolean partialAllowed;
    private Integer minPartialPercent;

    private Integer reminderDaysBefore;
    private boolean reminderOnDueDate;
    private Integer reminderDaysAfter;

    private String concessionType;    // NONE | FIXED | PERCENT
    private BigDecimal concessionValue;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    private String status;            // ACTIVE | INACTIVE
}
