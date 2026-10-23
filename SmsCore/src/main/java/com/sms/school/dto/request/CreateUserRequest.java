package com.sms.school.dto.request;

import com.sms.school.entity.enums.Gender;
import com.sms.school.entity.enums.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Used to create any user account (teacher, parent, admin, etc.).
 * The role determines which profile entity also gets created.
 */
@Data
public class CreateUserRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String phone;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String address;

    @NotNull(message = "Role is required")
    private RoleName role;
}
