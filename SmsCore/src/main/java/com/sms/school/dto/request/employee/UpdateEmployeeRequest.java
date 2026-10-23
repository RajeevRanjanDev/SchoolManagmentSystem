package com.sms.school.dto.request.employee;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UpdateEmployeeRequest {
    private String mobile;
    private String alternateMobile;
    private String currentAddress;
    private String permanentAddress;
    private String city;
    private String state;
    private String pincode;
    private Long departmentId;
    private Long designationId;
    private String bloodGroup;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
}
