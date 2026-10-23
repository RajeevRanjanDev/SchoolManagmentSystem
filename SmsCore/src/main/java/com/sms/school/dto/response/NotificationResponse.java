package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/** A single in-app notification for the recipient's inbox. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String body;
    private String type;
    private boolean read;
    private Long referenceId;
    private LocalDateTime createdAt;
    private String attachmentUrl;
    private String attachmentName;
}
