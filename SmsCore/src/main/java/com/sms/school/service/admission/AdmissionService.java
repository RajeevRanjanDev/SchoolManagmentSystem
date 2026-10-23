package com.sms.school.service.admission;

import com.sms.school.dto.request.admission.LifecycleTransitionRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest;
import com.sms.school.dto.request.admission.VerifyDocumentRequest;
import com.sms.school.dto.response.admission.StudentHistoryResponse;
import com.sms.school.dto.response.admission.StudentProfileResponse;
import com.sms.school.dto.response.admission.TransportStudentResponse;
import com.sms.school.entity.enums.DocumentType;
import com.sms.school.entity.enums.StudentLifecycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AdmissionService {

    StudentProfileResponse register(Long tenantId, RegisterStudentRequest request);

    StudentProfileResponse getById(Long tenantId, Long id);

    Page<StudentProfileResponse> list(Long tenantId, java.util.List<StudentLifecycleStatus> statuses,
                                      String search, Long classId, Long sectionId, Pageable pageable);

    /** Assign or change a student's class/section without a lifecycle promotion. */
    StudentProfileResponse assignClassSection(Long tenantId, Long id, LifecycleTransitionRequest req);

    /** Assign a roll number to a student — must be free within their section. */
    StudentProfileResponse assignRollNumber(Long tenantId, Long id, String rollNumber);

    /** Move a student to a different section of the SAME class. */
    StudentProfileResponse moveToSection(Long tenantId, Long id, Long targetSectionId);

    /** Deactivate a student (left school). Frees their roll number. */
    StudentProfileResponse deactivateStudent(Long tenantId, Long id, String remarks);

    /** Promote every active student of a class (all sections) to the next class. */
    java.util.Map<String, Object> promoteClass(Long tenantId, Long fromClassId, Long toClassId,
                                                String fromAcademicYear, String toAcademicYear);

    StudentProfileResponse update(Long tenantId, Long id, RegisterStudentRequest request);

    /** Generate a temp password for the student's login and email it. Returns the email it was sent to. */
    String resetStudentPassword(Long tenantId, Long id);

    // ── Lifecycle transitions ─────────────────────────────────────────
    StudentProfileResponse admit(Long tenantId, Long id, LifecycleTransitionRequest req);

    StudentProfileResponse enroll(Long tenantId, Long id, LifecycleTransitionRequest req);

    StudentProfileResponse promote(Long tenantId, Long id, LifecycleTransitionRequest req);

    StudentProfileResponse transfer(Long tenantId, Long id, LifecycleTransitionRequest req);

    StudentProfileResponse dropout(Long tenantId, Long id, String remarks);

    StudentProfileResponse markPassedOut(Long tenantId, Long id, String remarks);

    StudentProfileResponse convertToAlumni(Long tenantId, Long id, String remarks);

    // ── Guardian & transport updates ──────────────────────────────────
    StudentProfileResponse updateGuardians(Long tenantId, Long studentId,
                                           List<RegisterStudentRequest.GuardianRequest> guardians);

    StudentProfileResponse updateTransport(Long tenantId, Long studentId,
                                           RegisterStudentRequest.TransportInfoRequest transportReq);

    java.util.List<TransportStudentResponse> listTransportStudents(
            Long tenantId, Long classId, Long sectionId, Long routeId, String search);

    StudentProfileResponse updateMedical(Long tenantId, Long studentId,
                                         RegisterStudentRequest.MedicalInfoRequest medicalReq);

    StudentProfileResponse updateContact(Long tenantId, Long studentId, String mobile, String email);

    // ── Document management ───────────────────────────────────────────
    StudentProfileResponse uploadDocument(Long tenantId, Long studentId,
                                          DocumentType documentType,
                                          MultipartFile file);

    StudentProfileResponse verifyDocument(Long tenantId, Long studentId,
                                          Long documentId,
                                          VerifyDocumentRequest request);

    void delete(Long tenantId, Long id);

    java.util.List<StudentHistoryResponse> getHistory(Long tenantId, Long studentId);
}
