package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateClassRequest {

    @NotBlank(message = "Class name is required")
    private String name;          // e.g. "Class 5"

    private Integer numericName;  // e.g. 5  (for sorting)

    @NotBlank(message = "Academic year is required")
    private String academicYear;  // e.g. "2024-25"
}
