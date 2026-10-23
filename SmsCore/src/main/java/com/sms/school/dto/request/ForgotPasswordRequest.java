package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Self-service password reset: the user provides their email or login ID. */
@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Enter your email or login ID")
    private String identifier;
}
