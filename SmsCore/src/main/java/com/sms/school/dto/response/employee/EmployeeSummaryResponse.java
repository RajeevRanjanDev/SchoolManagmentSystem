package com.sms.school.dto.response.employee;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EmployeeSummaryResponse {
    private Long id;
    private String employeeCode;
    private String fullName;
    private String employeeType;
    private String employmentStatus;
    private String departmentName;
    private String designationName;
    private String profilePhotoUrl;
}
