package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChildSummaryResponse {

    private Long   studentId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String admissionNumber;
    private String profilePictureUrl;
    private String gender;
    private String bloodGroup;
    private String relationshipType;   // FATHER/MOTHER/GUARDIAN from the mapping

    // Current enrollment (null if not yet assigned to a class)
    private Long   classId;
    private String className;
    private Long   sectionId;
    private String sectionName;
    private String academicYear;
    private String rollNumber;
}
