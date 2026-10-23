package com.sms.school.entity;

import com.sms.school.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

/**
 * An in-app notification sent to a specific user.
 */
@Entity
@Table(name = "notifications",
        indexes = {
                @Index(name = "idx_notif_user", columnList = "recipient_user_id"),
                @Index(name = "idx_notif_school", columnList = "school_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    /** ID of the related entity (e.g. homeworkId, feeId) – for deep-linking */
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /** Whether FCM push was sent */
    @Column(name = "push_sent", nullable = false)
    private boolean pushSent = false;

    /** Optional file attachment (download URL + display name). */
    @Column(name = "attachment_url", length = 300)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;
}
