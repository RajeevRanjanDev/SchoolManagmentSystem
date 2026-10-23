package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Admin assigns a teacher to teach a subject in a class/section for an academic year.
 */
@Data
public class AssignTeacherRequest {

    @NotNull(message = "Class ID is required")
    private Long classId;

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotBlank(message = "Academic year is required")
    private String academicYear;   // e.g. "2025-26"

    /**
     * If true, marks this teacher as the class (homeroom) teacher for this section.
     * Only one class teacher per section per year is allowed.
     */
    private boolean classTeacher = false;
}
