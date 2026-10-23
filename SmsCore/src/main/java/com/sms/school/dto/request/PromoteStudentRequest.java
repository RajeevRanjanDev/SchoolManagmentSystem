package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PromoteStudentRequest {

    /** The year the student is currently enrolled in (will be closed) */
    @NotBlank(message = "Current academic year is required (e.g. 2025-26)")
    private String fromYear;

    /** Target class for the new enrollment */
    @NotNull(message = "Target class ID is required")
    private Long toClassId;

    /** Target section for the new enrollment */
    @NotNull(message = "Target section ID is required")
    private Long toSectionId;

    /** The next academic year (e.g. 2026-27) */
    @NotBlank(message = "Target academic year is required (e.g. 2026-27)")
    private String toYear;

    private String rollNumber;

    private String remarks;
}
