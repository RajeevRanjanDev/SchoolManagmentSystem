package com.sms.school.dto.response;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CampusResponse {
    private Long id;
    private String name;
    private String code;
    private String city;
    private String state;
    private String phone;
    private String email;
    private String principalName;
    private boolean mainCampus;
    private boolean active;
    private String institutionType;
    private String currentAcademicYear;
}
