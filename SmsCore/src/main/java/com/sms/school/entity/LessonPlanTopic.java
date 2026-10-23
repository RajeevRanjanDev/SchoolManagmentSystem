package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "lesson_plan_topics",
       indexes = @Index(name = "idx_lpt_plan", columnList = "lesson_plan_id, sequence_no"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LessonPlanTopic extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_plan_id", nullable = false)
    private LessonPlan lessonPlan;

    @Column(name = "chapter_name", nullable = false)
    private String chapterName;

    @Column(name = "topic_name", nullable = false)
    private String topicName;

    @Column(name = "learning_outcomes", columnDefinition = "TEXT")
    private String learningOutcomes;

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Builder.Default
    @Column(name = "periods_required")
    private int periodsRequired = 1;

    @Builder.Default
    @Column(name = "periods_completed")
    private int periodsCompleted = 0;

    /** PENDING | IN_PROGRESS | COMPLETED | DELAYED */
    @Builder.Default
    @Column(name = "completion_status", nullable = false)
    private String completionStatus = "PENDING";

    @Builder.Default
    @Column(name = "sequence_no")
    private int sequenceNo = 0;
}
