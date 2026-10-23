package com.sms.school.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResultResponse {

    private Long id;
    private String examName;
    private String subject;
    private LocalDate examDate;
    private BigDecimal totalMarks;
    private BigDecimal marksObtained;
    private String grade;
    private String remarks;
    private boolean isPublished;
}
