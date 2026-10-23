package com.sms.school.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeePaymentResponse {

    private Long id;
    private Long feeId;
    private String feeCategory;
    private String feePeriod;
    private String academicYear;
    private BigDecimal amountPaid;
    private LocalDateTime paymentDate;
    private String paymentMethod;
    private String transactionReference;
    private String receiptNumber;
    private String collectedByName;
    private String remarks;
}
