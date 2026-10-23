package com.sms.school.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LessonPlanResponse {
    private Long id;
    private Long schoolId;
    private Long teacherId;
    private String teacherName;
    private Long sectionId;
    private String sectionName;
    private String className;
    private Long subjectId;
    private String subjectName;
    private String academicYear;
    private String planType;
    private String planName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private int totalTopics;
    private int completedTopics;
    private int pendingTopics;
    private int delayedTopics;
    private double completionPercent;
    private List<TopicSummary> topics;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopicSummary {
        private Long id;
        private String chapterName;
        private String topicName;
        private String learningOutcomes;
        private LocalDate plannedDate;
        private LocalDate actualDate;
        private int periodsRequired;
        private int periodsCompleted;
        private String completionStatus;
        private int sequenceNo;
    }
}
