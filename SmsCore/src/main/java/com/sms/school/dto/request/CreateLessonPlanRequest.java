package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateLessonPlanRequest {

    @NotNull(message = "Section is required")
    private Long sectionId;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    /** ANNUAL | MONTHLY | WEEKLY | DAILY */
    @NotBlank(message = "Plan type is required")
    private String planType;

    private String planName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private List<TopicRequest> topics;

    @Data
    public static class TopicRequest {
        @NotBlank private String chapterName;
        @NotBlank private String topicName;
        private String learningOutcomes;
        private LocalDate plannedDate;
        private int periodsRequired = 1;
        private int sequenceNo;
    }
}
