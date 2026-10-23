package com.sms.school.dto.request.admission;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** Lightweight request to edit just a student's contact details (mobile + email). */
@Data
public class UpdateContactRequest {

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String mobile;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;
}
