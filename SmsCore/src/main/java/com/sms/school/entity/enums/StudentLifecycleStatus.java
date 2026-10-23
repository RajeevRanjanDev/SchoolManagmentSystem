package com.sms.school.entity.enums;

/**
 * Full student lifecycle state machine.
 *
 * LEAD → INQUIRY → APPLICANT → ADMISSION_REVIEW → ADMITTED → ENROLLED
 *   → PROMOTED | TRANSFERRED | DROPPED | PASSED_OUT → ALUMNI
 */
public enum StudentLifecycleStatus {
    LEAD,
    INQUIRY,
    APPLICANT,
    ADMISSION_REVIEW,
    ADMITTED,
    ENROLLED,
    PROMOTED,
    TRANSFERRED,
    DROPPED,
    PASSED_OUT,
    ALUMNI
}
