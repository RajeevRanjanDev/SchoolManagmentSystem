package com.sms.school.dto.response.student;

import lombok.*;

import java.time.LocalDate;

/** A homework or classwork item for the student's class. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAssignmentResponse {
    private Long id;
    private String type;        // HOMEWORK | CLASSWORK
    private String subject;
    private String title;
    private String description;
    private LocalDate date;      // assigned/class date
    private LocalDate dueDate;   // homework only
}
