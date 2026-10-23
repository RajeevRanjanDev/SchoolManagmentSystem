package com.sms.school.dto.request.admission;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LifecycleTransitionRequest {

    /** Target class/section for PROMOTE or TRANSFER */
    private Long targetClassId;
    private Long targetSectionId;
    private String targetAcademicSession;
    private String targetInstitution;

    @NotNull
    private LocalDate effectiveDate;

    private String remarks;
}
