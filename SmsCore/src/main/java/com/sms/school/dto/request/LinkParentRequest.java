package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LinkParentRequest {

    @NotNull(message = "Parent ID is required")
    private Long parentId;

    /** FATHER | MOTHER | GUARDIAN | STEP_PARENT | SIBLING_GUARDIAN */
    @NotBlank(message = "Relationship type is required")
    private String relationshipType;

    private boolean primaryContact    = false;
    private boolean emergencyContact  = false;
    private boolean canPickup         = true;
}
