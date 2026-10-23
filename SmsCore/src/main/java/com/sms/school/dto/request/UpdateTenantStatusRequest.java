package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateTenantStatusRequest {

    @NotBlank
    @Pattern(regexp = "TRIAL|ACTIVE|SUSPENDED|TERMINATED",
             message = "Status must be one of: TRIAL, ACTIVE, SUSPENDED, TERMINATED")
    private String status;

    /** Optional reason for audit log */
    private String reason;
}
