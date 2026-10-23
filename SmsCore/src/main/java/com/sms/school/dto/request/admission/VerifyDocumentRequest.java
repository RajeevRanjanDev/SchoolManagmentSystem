package com.sms.school.dto.request.admission;

import com.sms.school.entity.enums.DocumentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VerifyDocumentRequest {

    @NotNull
    private DocumentStatus status; // VERIFIED | REJECTED

    private String rejectionReason;
}
