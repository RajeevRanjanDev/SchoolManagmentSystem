package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateParentRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Mobile number is required")
    private String mobile;

    private String email;
    private String occupation;
    private String relation;       // FATHER, MOTHER, GUARDIAN
    private String alternatePhone;
    private String address;

    /** If true, send an SMS/email invitation for the parent to register a login */
    private boolean sendInvite = false;
}
