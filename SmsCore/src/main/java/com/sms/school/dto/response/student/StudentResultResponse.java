package com.sms.school.dto.response.student;

import lombok.*;

import java.time.LocalDate;

/** A single exam result for the logged-in student. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResultResponse {
    private Long id;
    private String examName;
    private String subject;
    private LocalDate examDate;
    private Double totalMarks;
    private Double marksObtained;
    private String grade;
    private boolean published;
}
