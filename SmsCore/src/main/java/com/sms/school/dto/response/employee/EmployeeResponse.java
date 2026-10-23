package com.sms.school.dto.response.employee;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String employeeCode;
    private String fullName;
    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    private String mobile;
    private String email;
    private String officialEmail;
    private String employeeType;
    private String employmentStatus;
    private LocalDate joiningDate;
    private String departmentName;
    private String designationName;
    private String profilePhotoUrl;
    private String city;
    private String state;
}
