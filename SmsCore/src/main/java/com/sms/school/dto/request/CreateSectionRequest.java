package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSectionRequest {

    @NotBlank(message = "Section name is required")
    private String name;         // e.g. "A", "B"

    private Integer maxCapacity; // e.g. 40
}
