package com.sms.school.dto.request;

import com.sms.school.entity.enums.RoleName;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * Admin creates a teacher profile (may or may not create a login user simultaneously).
 */
@Data
public class CreateTeacherRequest {

    /** Login email for the employee account (mandatory). A temp password is generated and emailed. */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;
    private String password;           // optional — a temp password is generated when blank

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String mobile;
    private String employeeCode;

    /** Employee role. Defaults to TEACHER when not provided. */
    private RoleName role;
    private String qualification;
    private String specialization;
    private LocalDate joiningDate;
    private Integer experienceYears;
    private String photoUrl;

    /** ACTIVE | INACTIVE */
    private String status = "ACTIVE";
}
