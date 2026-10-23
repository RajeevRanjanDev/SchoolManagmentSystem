package com.sms.school.dto.response.student;

import lombok.*;

import java.time.LocalDate;

/** The logged-in student's own basic profile. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentMeResponse {
    private Long studentId;
    private String admissionNumber;   // also the login ID
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String email;
    private String mobile;
    private String className;
    private String sectionName;
    private String rollNumber;
    private String fatherName;
    private String motherName;
    private String schoolName;

    // Transport
    private boolean transportRequired;
    private String routeName;
    private String stopName;
    private String pickupPoint;
    private String transportType;
}
