package com.sms.school.dto.request;

import lombok.Data;

@Data
public class SubmitHomeworkRequest {

    /** Optional: URL of the uploaded file (pre-uploaded by client) */
    private String submissionUrl;

    /** Optional: plain-text response */
    private String textResponse;
}
