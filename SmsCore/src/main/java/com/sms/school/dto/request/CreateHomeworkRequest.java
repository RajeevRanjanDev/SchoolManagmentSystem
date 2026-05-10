package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateHomeworkRequest {

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Assigned date is required")
    private LocalDate assignedDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String attachmentUrl;
}
