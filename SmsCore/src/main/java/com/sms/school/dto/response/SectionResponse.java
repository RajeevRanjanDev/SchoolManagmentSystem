package com.sms.school.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {

    private Long id;
    private Long schoolId;
    private Long classId;
    private String className;
    private String name;
    private Integer maxCapacity;
    private Long classTeacherId;
    private String classTeacherName;
    private String status;
    private Long studentCount;
}
