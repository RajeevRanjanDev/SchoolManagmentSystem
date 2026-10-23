package com.sms.school.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateFeeRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotBlank(message = "Fee category is required")
    private String feeCategory;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotBlank(message = "Fee period is required")
    private String feePeriod;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private BigDecimal discount;

    private BigDecimal fine;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String remarks;
}
