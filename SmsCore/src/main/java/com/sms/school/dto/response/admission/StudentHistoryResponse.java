package com.sms.school.dto.response.admission;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentHistoryResponse {
    private Long id;
    private String fromStatus;
    private String toStatus;
    private String action;
    private String remarks;
    private String changedBy;
    private LocalDate effectiveDate;
    private String createdAt;
}
