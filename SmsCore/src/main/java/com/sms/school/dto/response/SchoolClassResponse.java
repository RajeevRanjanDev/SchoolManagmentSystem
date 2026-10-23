package com.sms.school.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClassResponse {

    private Long id;
    private Long schoolId;
    private String name;
    private Integer numericName;
    private String academicYear;
    private String status;
    private Integer sectionCount;
    private Long studentCount;
    private LocalDateTime createdAt;

    /** Sections belonging to this class (populated on demand) */
    private List<SectionResponse> sections;
}
