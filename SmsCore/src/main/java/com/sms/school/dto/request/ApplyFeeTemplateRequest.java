package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Apply a fee template to a chosen scope, generating fee records.
 * scope = CLASS (whole class) | SECTION (one section) | STUDENT (one child).
 */
@Data
public class ApplyFeeTemplateRequest {

    @NotBlank(message = "Scope is required (CLASS | SECTION | STUDENT)")
    private String scope;

    private Long classId;
    private Long sectionId;
    private Long studentId;
}
