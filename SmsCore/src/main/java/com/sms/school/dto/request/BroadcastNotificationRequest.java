package com.sms.school.dto.request;

import com.sms.school.entity.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BroadcastNotificationRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Body is required")
    private String body;

    @NotNull(message = "Notification type is required")
    private NotificationType type;

    /**
     * Who can see this notification:
     *  ALL_SCHOOL       = everyone
     *  TEACHERS         = all teachers
     *  CLASS_TEACHERS   = class teachers only
     *  CLASS            = class teachers of a class (classId)
     *  CLASS_STUDENTS   = all students of a class (classId)
     *  SECTION_STUDENTS = all students of a section (sectionId)
     *  STUDENT          = one student (studentId)
     *  FEE_DEFAULTERS   = students with an unpaid fee (feeType, optional classId/sectionId scope)
     */
    private String audience = "ALL_SCHOOL";

    /** Scope ids used by the audiences above. */
    private Long classId;
    private Long sectionId;
    private Long studentId;

    /** For FEE_DEFAULTERS: TUITION | TRANSPORT | ANY. */
    private String feeType;

    /** If set in the future, the notification is scheduled instead of sent now. */
    private LocalDateTime scheduledAt;

    /** Optional attachment: download URL (from POST /attachments) + display name. */
    private String attachmentUrl;
    private String attachmentName;
}
