package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyWorkResponse {

    private Long id;
    private Long sectionId;
    private String sectionName;
    private String className;
    private LocalDate workDate;
    private String type;
    private String description;
    private String createdByName;
    private LocalDateTime updatedAt;
}
