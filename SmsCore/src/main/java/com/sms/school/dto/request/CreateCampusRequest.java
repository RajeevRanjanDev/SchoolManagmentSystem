package com.sms.school.dto.request;

import com.sms.school.entity.enums.InstitutionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateCampusRequest {
    @NotBlank @Size(max = 200)
    private String name;

    @NotBlank @Size(max = 30)
    private String code;

    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private String principalName;
    private InstitutionType institutionType;
    private Boolean mainCampus;
}
