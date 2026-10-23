package com.sms.school.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** SUPER_ADMIN issues a subscription invoice to a school. */
@Data
public class CreateInvoiceRequest {

    /** Defaults to the school's current plan if omitted. */
    private String planCode;

    private String billingPeriod;        // MONTHLY | ANNUAL

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private LocalDate issueDate;         // defaults to today
    private LocalDate dueDate;
    private String notes;
}
