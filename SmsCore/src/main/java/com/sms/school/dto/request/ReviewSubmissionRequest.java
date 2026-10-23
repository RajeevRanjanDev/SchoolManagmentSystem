package com.sms.school.dto.request;

import lombok.Data;

/**
 * Teacher reviews a homework submission — grades it and sets outcome status.
 */
@Data
public class ReviewSubmissionRequest {

    /** ACCEPTED | REJECTED | RESUBMIT | COMPLETED */
    private String status;

    private String grade;

    private String teacherRemarks;

    /** URL of the annotated/returned file (optional) */
    private String reviewedFileUrl;
}
