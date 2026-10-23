package com.sms.school.ops.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** DTOs for the Super Admin Operations (error tracking) dashboard. */
public final class OpsDtos {
    private OpsDtos() {}

    @Data @Builder
    public static class OpsSummary {
        private long systemErrors;       // total captured in range
        private long affectedSchools;    // distinct schools with errors in range
        private long failedPayments;     // failed gateway transactions in range
        private long criticalIncidents;  // CRITICAL severity in range
        private long openIncidents;      // status = OPEN (all time)
    }

    @Data @Builder
    public static class ErrorLogView {
        private Long id;
        private Long schoolId;
        private String schoolName;
        private String service;
        private String severity;
        private String errorCode;
        private String message;
        private String requestId;
        private String traceId;
        private Long userId;
        private String httpMethod;
        private String httpPath;
        private Integer httpStatus;
        private String referenceType;
        private Long referenceId;
        private String environment;
        private int occurrenceCount;
        private String status;
        private Long ownerUserId;
        private String resolutionNote;
        private LocalDateTime createdAt;
        private LocalDateTime lastSeenAt;
        private LocalDateTime resolvedAt;
        private String stackTrace;       // populated only in the detail view
    }

    @Data
    public static class ResolveRequest {
        private String status;           // INVESTIGATING | RESOLVED
        private String note;
    }
}
