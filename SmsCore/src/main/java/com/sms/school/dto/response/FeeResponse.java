package com.sms.school.dto.response;

import com.sms.school.entity.enums.FeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private String feeCategory;
    private String academicYear;
    private String feePeriod;
    private BigDecimal amount;
    private BigDecimal discount;
    private BigDecimal fine;
    private BigDecimal netAmount;   // amount - discount + fine
    private LocalDate dueDate;
    private FeeStatus status;
    private String remarks;
}
