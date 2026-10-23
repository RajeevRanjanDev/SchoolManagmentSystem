package com.sms.school.entity;

import com.sms.school.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

/**
 * A log of each admin-sent notification broadcast, so the sender can see a
 * history of what was sent and to whom (useful for targeted audiences where
 * the sender is not among the recipients).
 */
@Entity
@Table(name = "notification_broadcasts",
        indexes = @Index(name = "idx_broadcast_school", columnList = "school_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationBroadcast extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** ALL_SCHOOL | TEACHERS | CLASS_TEACHERS | CLASS */
    @Column(nullable = false)
    private String audience;

    /** Scope ids for the audience. */
    @Column(name = "class_id")
    private Long classId;

    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "student_id")
    private Long studentId;

    /** For FEE_DEFAULTERS. */
    @Column(name = "fee_type")
    private String feeType;

    /** Human-readable class name, when audience = CLASS */
    @Column(name = "class_name")
    private String className;

    /** How many users received this broadcast */
    @Column(name = "recipient_count", nullable = false)
    private Integer recipientCount;

    /** Display name/email of the sender */
    @Column(name = "sent_by_name")
    private String sentByName;

    /** SENT | SCHEDULED. */
    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = "SENT";

    /** When a scheduled notification should fire. */
    @Column(name = "scheduled_at")
    private java.time.LocalDateTime scheduledAt;

    /** Optional file attachment (download URL + display name). */
    @Column(name = "attachment_url", length = 300)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;
}
