package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** A SCHOOL_ADMIN user account shown to SUPER_ADMIN. */
@Data
@Builder
public class SchoolAdminResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String mobile;
    private boolean active;
    private String status;        // ACTIVE | DEACTIVATED
    private LocalDateTime createdAt;
}
