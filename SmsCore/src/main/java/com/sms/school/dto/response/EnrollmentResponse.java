package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EnrollmentResponse {

    private Long   id;
    private Long   studentId;
    private String studentName;
    private Long   classId;
    private String className;
    private Long   sectionId;
    private String sectionName;
    private String academicYear;
    private String rollNumber;
    private String status;          // ACTIVE, PROMOTED, TRANSFERRED, WITHDRAWN
    private String remarks;
    private LocalDateTime createdAt;
}
