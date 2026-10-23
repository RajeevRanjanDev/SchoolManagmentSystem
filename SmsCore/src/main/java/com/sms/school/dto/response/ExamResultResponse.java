package com.sms.school.dto.response;

import lombok.*;

/** A student's result for a specific exam (used by the admin/teacher result-entry screen). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultResponse {

    private Long id;
    private Long examId;
    private String examName;
    private Double totalMarks;
    private Long studentId;
    private String studentName;
    private Double marksObtained;
    private String grade;
    private boolean published;
}
