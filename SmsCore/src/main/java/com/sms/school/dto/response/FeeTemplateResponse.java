package com.sms.school.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeTemplateResponse {

    private Long id;
    private Long schoolId;
    private String name;
    private String feeType;
    private BigDecimal amount;
    private String frequency;
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
    private String concessionType;
    private BigDecimal concessionValue;
    private String academicYear;
    private String status;
    private LocalDateTime createdAt;
}
