package com.sms.school.dto.response;

import com.sms.school.entity.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long id;
    private Long schoolId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String admissionNumber;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String bloodGroup;
    private String address;
    private String profilePictureUrl;
    private LocalDate admissionDate;
    private boolean active;
    private Long parentId;
    private String parentName;
    private Long transportRouteId;
    private String transportRouteName;
    private LocalDateTime createdAt;
}
