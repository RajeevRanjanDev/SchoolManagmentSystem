package com.sms.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassAnnouncementResponse {

    private Long id;
    private Long schoolId;

    private Long teacherId;
    private String teacherName;

    private Long classId;
    private String className;

    private Long sectionId;        // null = class-wide
    private String sectionName;

    private Long studentId;        // non-null = targeted at one student
    private String studentName;

    private String title;
    private String content;
    private String attachmentUrl;
    private String attachmentName;

    private boolean published;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
