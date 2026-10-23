package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ParentResponse {

    private Long   id;
    private Long   schoolId;
    private Long   userId;          // null if no login yet
    private String firstName;
    private String lastName;
    private String fullName;
    private String mobile;
    private String email;
    private String occupation;
    private String relation;
    private String alternatePhone;
    private String photoUrl;
    private String status;
    private boolean hasLogin;
    private List<ChildSummaryResponse> linkedChildren;
    private LocalDateTime createdAt;
}
