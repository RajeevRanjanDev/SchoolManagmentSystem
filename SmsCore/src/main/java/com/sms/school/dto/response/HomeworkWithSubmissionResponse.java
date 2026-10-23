package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * Homework item with the student's submission status.
 * Used in the Parent App homework screen.
 */
@Data
@Builder
public class HomeworkWithSubmissionResponse {

    private Long      id;
    private String    title;
    private String    description;
    private String    subject;
    private LocalDate assignedDate;
    private LocalDate dueDate;
    private String    attachmentUrl;

    // Submission (null if not yet submitted)
    private String    submissionStatus;  // SUBMITTED, LATE, REVIEWED, GRADED — null if pending
    private String    submissionUrl;
    private String    grade;
    private String    teacherRemarks;
}
