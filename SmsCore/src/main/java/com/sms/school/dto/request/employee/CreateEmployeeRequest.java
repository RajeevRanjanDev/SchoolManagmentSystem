package com.sms.school.dto.request.employee;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateEmployeeRequest {

    @NotBlank @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String middleName;

    @NotBlank @Size(max = 100)
    private String lastName;

    private String gender;

    @Past
    private LocalDate dateOfBirth;

    private String bloodGroup;

    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be 12 digits")
    private String aadhaarNumber;

    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format")
    private String panNumber;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String mobile;

    @Email
    private String email;

    @Email
    private String officialEmail;

    private Long departmentId;
    private Long designationId;

    /** FULL_TIME | PART_TIME | CONTRACT | VISITING | INTERN */
    private String employeeType;

    private LocalDate joiningDate;
    private String currentAddress;
    private String city;
    private String state;
    private String pincode;
}
