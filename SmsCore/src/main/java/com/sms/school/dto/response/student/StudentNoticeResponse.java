package com.sms.school.dto.response.student;

import lombok.*;

import java.time.LocalDateTime;

/** A circular / notice item shown to the student, tagged by category. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentNoticeResponse {
    private Long id;
    private String category;    // CIRCULAR | GENERAL | FEE_REMINDER | EXAM_SCHEDULE | ATTENDANCE_ALERT | RESULT_PUBLISHED | HOMEWORK | EVENT
    private String title;
    private String body;
    private String source;      // NOTIFICATION | ANNOUNCEMENT | CIRCULAR
    private boolean read;
    private LocalDateTime date;
    private String attachmentUrl;
    private String attachmentName;
}
