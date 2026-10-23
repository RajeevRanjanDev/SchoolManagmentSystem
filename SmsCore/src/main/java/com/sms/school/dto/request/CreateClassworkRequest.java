package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Teacher creates a classwork / lesson entry for an assigned class-section-subject.
 */
@Data
public class CreateClassworkRequest {

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotBlank(message = "Topic is required")
    private String topic;

    private String description;

    @NotNull(message = "Class date is required")
    private LocalDate classDate;

    private String notes;
    private String attachmentUrl;
}
