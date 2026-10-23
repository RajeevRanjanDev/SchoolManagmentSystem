package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AssignSubscriptionRequest {

    @NotBlank(message = "Plan code is required")
    private String planCode;

    /** If null, system auto-calculates based on plan trial_days or 1 year. */
    private LocalDate expiryDate;
}
