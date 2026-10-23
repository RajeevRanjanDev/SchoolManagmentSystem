package com.sms.school.dto.request;

import com.sms.school.entity.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateStudentRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Admission number is required")
    private String admissionNumber;

    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private Gender gender;

    private String bloodGroup;
    private String address;
    private LocalDate admissionDate;

    /** Parent account to link (optional at creation time) */
    private Long parentId;

    /** Transport route (optional) */
    private Long transportRouteId;
}
