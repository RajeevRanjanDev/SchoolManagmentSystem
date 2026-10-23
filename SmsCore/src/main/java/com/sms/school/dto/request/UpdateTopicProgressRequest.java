package com.sms.school.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateTopicProgressRequest {
    private LocalDate actualDate;
    private int periodsCompleted;
    /** PENDING | IN_PROGRESS | COMPLETED | DELAYED */
    private String completionStatus;
}
