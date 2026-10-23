package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/** A fuller read-only student profile shown to the class teacher. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherStudentCardResponse {

    private Long studentId;
    private String admissionNumber;
    private String firstName;
    private String lastName;
    private String rollNumber;
    private String className;
    private String sectionName;

    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;
    private String category;
    private String nationality;
    private String religion;

    private String mobile;
    private String email;

    private String currentAddress;
    private String permanentAddress;

    private List<Guardian> guardians;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Guardian {
        private String relation;
        private String name;
        private String mobile;
        private String email;
    }
}
