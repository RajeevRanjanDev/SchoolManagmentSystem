package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateDailyWorkRequest {

    @NotNull(message = "Section is required")
    private Long sectionId;

    @NotNull(message = "Date is required")
    private LocalDate workDate;

    /** HOMEWORK or CLASSWORK */
    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Description is required")
    private String description;
}
