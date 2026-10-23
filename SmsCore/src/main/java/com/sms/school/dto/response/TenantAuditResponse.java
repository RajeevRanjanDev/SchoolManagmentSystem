package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** A single audit-log entry in a school's change history. */
@Data
@Builder
public class TenantAuditResponse {
    private Long id;
    private String action;
    private String entityType;
    private String description;
    private String oldValue;
    private String newValue;
    private String performedBy;
    private LocalDateTime createdAt;
}
