package com.sms.school.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Payload for SUPER_ADMIN to create the first/additional admin user for a school.
 */
@Data
public class CreateSchoolAdminRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Valid email is required")
    @NotBlank
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;   // if null, system sends email invite / sets default

    private String mobile;
}
