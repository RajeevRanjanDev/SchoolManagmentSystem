package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A subscription invoice shown to SUPER_ADMIN. */
@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private Long schoolId;
    private String invoiceNumber;
    private String planCode;
    private String planName;
    private String billingPeriod;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate paidDate;
    private String status;
    private String notes;
}
