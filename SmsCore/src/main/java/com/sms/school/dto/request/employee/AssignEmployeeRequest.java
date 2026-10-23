package com.sms.school.dto.request.employee;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AssignEmployeeRequest {

    /** CLASS_SECTION | PROGRAM_SEMESTER | BATCH_COURSE */
    @NotBlank
    private String assignmentType;

    // School
    private Long classId;
    private Long sectionId;

    // College / University
    private Long programId;
    private Long semesterId;
    private Long departmentId;

    // Coaching / Training
    private Long batchId;

    // Shared
    private Long subjectId;
    private String academicSession;
    private Boolean classTeacher;
    private LocalDate startDate;
    private LocalDate endDate;
}
