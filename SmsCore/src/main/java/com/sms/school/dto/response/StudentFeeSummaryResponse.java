package com.sms.school.dto.response;

import lombok.*;

import java.math.BigDecimal;

/** Per-student fee totals, used for the class/section-wide ledger view. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFeeSummaryResponse {

    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String rollNumber;
    private BigDecimal totalBilled;
    private BigDecimal totalPaid;
    private BigDecimal totalBalance;
    private int feeCount;
}
