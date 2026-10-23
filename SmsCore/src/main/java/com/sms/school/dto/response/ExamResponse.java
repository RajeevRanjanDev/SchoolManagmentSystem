package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {

    private Long id;
    private Long sectionId;
    private String sectionName;
    private String className;
    private String examName;
    private String subject;
    private LocalDate examDate;
    private Double totalMarks;
    private String academicYear;
}
