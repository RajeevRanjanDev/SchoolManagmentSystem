package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSubjectRequest {

    private String subjectCode;

    @NotBlank(message = "Subject name is required")
    private String subjectName;

    private String description;
    private String status = "ACTIVE";
}
