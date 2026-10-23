package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDateTime;

/** A single sent-notification record for the admin's "Sent" history. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastHistoryResponse {

    private Long id;
    private String title;
    private String body;
    private String type;
    private String audience;
    private Long classId;
    private String className;
    private Integer recipientCount;
    private String sentByName;
    private LocalDateTime sentAt;
    private String status;              // SENT | SCHEDULED
    private LocalDateTime scheduledAt;
}
