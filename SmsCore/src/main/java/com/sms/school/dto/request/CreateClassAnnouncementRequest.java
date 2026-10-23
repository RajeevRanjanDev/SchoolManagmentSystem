package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Teacher posts a notice to their class/section.
 */
@Data
public class CreateClassAnnouncementRequest {

    @NotNull(message = "Class ID is required")
    private Long classId;

    /** Null = entire class; non-null = specific section only. */
    private Long sectionId;

    /** Non-null = notice targeted at one student (requires sectionId). */
    private Long studentId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String attachmentUrl;
    private String attachmentName;

    /** Defaults to true — set false to save as draft. */
    private boolean published = true;
}
