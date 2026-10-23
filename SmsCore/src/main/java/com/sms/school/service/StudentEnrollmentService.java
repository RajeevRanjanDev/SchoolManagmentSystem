package com.sms.school.service;

import com.sms.school.dto.request.EnrollStudentRequest;
import com.sms.school.dto.request.LinkParentRequest;
import com.sms.school.dto.request.PromoteStudentRequest;
import com.sms.school.dto.response.EnrollmentResponse;

import java.util.List;

public interface StudentEnrollmentService {

    /** Assign student to a class/section for a given academic year */
    EnrollmentResponse enrollStudent(Long schoolId, Long studentId, EnrollStudentRequest request);

    /** Promote student to the next class/year (closes current, opens new) */
    EnrollmentResponse promoteStudent(Long schoolId, Long studentId, PromoteStudentRequest request);

    /** Transfer student to another section within the same academic year */
    EnrollmentResponse transferSection(Long schoolId, Long studentId, EnrollStudentRequest request);

    /** Full enrollment history for a student */
    List<EnrollmentResponse> getEnrollmentHistory(Long schoolId, Long studentId);

    /** Current active enrollment */
    EnrollmentResponse getActiveEnrollment(Long schoolId, Long studentId, String academicYear);

    /** Link a parent to a student with relationship type */
    void linkParent(Long schoolId, Long studentId, LinkParentRequest request);

    /** Unlink a parent from a student */
    void unlinkParent(Long schoolId, Long studentId, Long parentId);
}
