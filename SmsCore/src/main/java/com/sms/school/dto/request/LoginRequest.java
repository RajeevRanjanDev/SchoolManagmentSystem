package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    /**
     * Login identifier — an email (admins/super-admins) or a generated login ID
     * (students = admission number, teachers = schoolCode-TE-year-seq).
     * No @Email validation, since login IDs are not email addresses.
     */
    @NotBlank(message = "Email or login ID is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
