package com.sms.school.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSchoolRequest {

    @NotBlank(message = "School name is required")
    private String name;

    @NotBlank(message = "School code is required")
    private String code;

    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String phone;

    @Email(message = "Please provide a valid email")
    private String email;

    private String website;
    private String currentAcademicYear;
}
