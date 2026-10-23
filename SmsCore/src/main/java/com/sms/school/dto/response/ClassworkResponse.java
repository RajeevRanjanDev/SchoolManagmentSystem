package com.sms.school.dto.response;

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
public class ClassworkResponse {

    private Long id;
    private Long schoolId;

    private Long teacherId;
    private String teacherName;

    private Long classId;
    private String className;

    private Long sectionId;
    private String sectionName;

    private Long subjectId;
    private String subjectName;

    private String academicYear;
    private String topic;
    private String description;
    private LocalDate classDate;
    private String notes;
    private String attachmentUrl;

    private LocalDateTime createdAt;
}
