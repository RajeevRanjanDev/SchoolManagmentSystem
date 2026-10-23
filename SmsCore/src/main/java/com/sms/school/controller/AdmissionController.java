package com.sms.school.controller;

import com.sms.school.dto.request.admission.LifecycleTransitionRequest;
import com.sms.school.dto.request.admission.RegisterStudentRequest;
import com.sms.school.dto.request.admission.VerifyDocumentRequest;
import java.util.List;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.admission.StudentHistoryResponse;
import com.sms.school.dto.response.admission.StudentProfileResponse;
import com.sms.school.entity.enums.DocumentType;
import com.sms.school.entity.enums.StudentLifecycleStatus;
import com.sms.school.security.TenantContext;
import com.sms.school.service.admission.AdmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admission/students")
@RequiredArgsConstructor
@Tag(name = "Admission", description = "Student Admission & Registration — full lifecycle")
public class AdmissionController {

    private final AdmissionService admissionService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN','DEAN','PRINCIPAL')")
    @Operation(summary = "Register a new student — all institution types")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> register(
            @Valid @RequestBody RegisterStudentRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        StudentProfileResponse res = admissionService.register(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registered successfully", res));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN','DEAN','PRINCIPAL','TEACHER','ACCOUNTANT')")
    @Operation(summary = "List students — filter by status or free-text search")
    public ResponseEntity<ApiResponse<Page<StudentProfileResponse>>> list(
            @RequestParam(required = false) StudentLifecycleStatus status,
            @RequestParam(required = false) String statusGroup,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @PageableDefault(size = 20) Pageable pageable) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                admissionService.list(tenantId, resolveStatuses(status, statusGroup), search, classId, sectionId, pageable)));
    }

    /** Collapse the many internal lifecycle states into the three the admin cares about. */
    private List<StudentLifecycleStatus> resolveStatuses(StudentLifecycleStatus status, String group) {
        if (group != null && !group.isBlank()) {
            return switch (group.trim().toUpperCase()) {
                case "ADMITTED", "ACTIVE" -> List.of(
                        StudentLifecycleStatus.LEAD, StudentLifecycleStatus.INQUIRY,
                        StudentLifecycleStatus.APPLICANT, StudentLifecycleStatus.ADMISSION_REVIEW,
                        StudentLifecycleStatus.ADMITTED, StudentLifecycleStatus.ENROLLED,
                        StudentLifecycleStatus.PROMOTED);
                case "PASSED_OUT", "PASSEDOUT" -> List.of(
                        StudentLifecycleStatus.PASSED_OUT, StudentLifecycleStatus.ALUMNI);
                case "DEACTIVATED", "DROPPED" -> List.of(
                        StudentLifecycleStatus.DROPPED, StudentLifecycleStatus.TRANSFERRED);
                default -> null;
            };
        }
        return status != null ? List.of(status) : null;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full student profile by ID")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getById(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(admissionService.getById(tenantId, id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update student profile")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody RegisterStudentRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Updated",
                admissionService.update(tenantId, id, request)));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Generate a temporary password for the student and email it")
    public ResponseEntity<ApiResponse<Void>> resetStudentPassword(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        String email = admissionService.resetStudentPassword(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success("Temporary password emailed to " + email, null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Soft-delete a student profile")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        admissionService.delete(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Lifecycle transitions ─────────────────────────────────────────

    @PostMapping("/{id}/admit")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    @Operation(summary = "Admit an applicant — APPLICANT → ADMITTED")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> admit(
            @PathVariable Long id,
            @Valid @RequestBody LifecycleTransitionRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student admitted",
                admissionService.admit(tenantId, id, request)));
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Enroll an admitted student — ADMITTED → ENROLLED")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> enroll(
            @PathVariable Long id,
            @Valid @RequestBody LifecycleTransitionRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student enrolled",
                admissionService.enroll(tenantId, id, request)));
    }

    @PostMapping("/{id}/assign-class")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Assign or change a student's class & section (no lifecycle promotion)")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> assignClass(
            @PathVariable Long id,
            @Valid @RequestBody LifecycleTransitionRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Class/section updated",
                admissionService.assignClassSection(tenantId, id, request)));
    }

    @PatchMapping("/{id}/roll-number")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Assign a roll number (must be free within the student's section)")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> assignRollNumber(
            @PathVariable Long id, @RequestParam String rollNumber) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Roll number assigned",
                admissionService.assignRollNumber(tenantId, id, rollNumber)));
    }

    @PostMapping("/{id}/move-section")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Move a student to another section of the same class")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> moveSection(
            @PathVariable Long id, @RequestParam Long sectionId) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student moved",
                admissionService.moveToSection(tenantId, id, sectionId)));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Deactivate a student (left school). Frees their roll number.")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> deactivate(
            @PathVariable Long id, @RequestParam(required = false) String remarks) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student deactivated",
                admissionService.deactivateStudent(tenantId, id, remarks)));
    }

    @PostMapping("/promote-class")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    @Operation(summary = "Promote all active students of a class (all sections) to the next class")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> promoteClass(
            @RequestParam Long fromClassId,
            @RequestParam Long toClassId,
            @RequestParam String fromAcademicYear,
            @RequestParam String toAcademicYear) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        var result = admissionService.promoteClass(tenantId, fromClassId, toClassId, fromAcademicYear, toAcademicYear);
        return ResponseEntity.ok(ApiResponse.success(
                result.get("promoted") + " student(s) promoted from " + result.get("fromClass")
                        + " to " + result.get("toClass") + ".", result));
    }

    @PostMapping("/{id}/promote")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    @Operation(summary = "Promote student to next class/year — ENROLLED → PROMOTED")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> promote(
            @PathVariable Long id,
            @Valid @RequestBody LifecycleTransitionRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student promoted",
                admissionService.promote(tenantId, id, request)));
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL')")
    @Operation(summary = "Transfer student to another institution")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> transfer(
            @PathVariable Long id,
            @Valid @RequestBody LifecycleTransitionRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student transferred",
                admissionService.transfer(tenantId, id, request)));
    }

    @PostMapping("/{id}/dropout")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL')")
    @Operation(summary = "Mark student as dropped out")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> dropout(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student marked as dropped",
                admissionService.dropout(tenantId, id, remarks)));
    }

    @PostMapping("/{id}/passout")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    @Operation(summary = "Mark student as passed out")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> passout(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student marked as passed out",
                admissionService.markPassedOut(tenantId, id, remarks)));
    }

    @PostMapping("/{id}/alumni")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Convert passed-out student to alumni")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> alumni(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Student converted to alumni",
                admissionService.convertToAlumni(tenantId, id, remarks)));
    }

    // ── Guardian & transport updates ──────────────────────────────────

    @PutMapping("/{id}/guardians")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Replace all guardians for a student")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateGuardians(
            @PathVariable Long id,
            @Valid @RequestBody List<RegisterStudentRequest.GuardianRequest> guardians) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Guardians updated",
                admissionService.updateGuardians(tenantId, id, guardians)));
    }

    @PutMapping("/{id}/transport")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update transport assignment for a student")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateTransport(
            @PathVariable Long id,
            @Valid @RequestBody RegisterStudentRequest.TransportInfoRequest transportReq) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Transport updated",
                admissionService.updateTransport(tenantId, id, transportReq)));
    }

    @PutMapping("/{id}/medical")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update medical details for a student")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMedical(
            @PathVariable Long id,
            @Valid @RequestBody RegisterStudentRequest.MedicalInfoRequest medicalReq) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Medical details updated",
                admissionService.updateMedical(tenantId, id, medicalReq)));
    }

    @PutMapping("/{id}/contact")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update a student's contact details (mobile + email)")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateContact(
            @PathVariable Long id,
            @Valid @RequestBody com.sms.school.dto.request.admission.UpdateContactRequest req) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Contact details updated",
                admissionService.updateContact(tenantId, id, req.getMobile(), req.getEmail())));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get lifecycle history for a student")
    public ResponseEntity<ApiResponse<java.util.List<StudentHistoryResponse>>> getHistory(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(admissionService.getHistory(tenantId, id)));
    }

    // ── Document management ───────────────────────────────────────────

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Upload a document for a student")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> uploadDocument(
            @PathVariable Long id,
            @RequestParam DocumentType documentType,
            @RequestParam MultipartFile file) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Document uploaded",
                admissionService.uploadDocument(tenantId, id, documentType, file)));
    }

    @PatchMapping("/{id}/documents/{documentId}/verify")
    @PreAuthorize("hasAnyRole('ADMISSION_OFFICER','SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL')")
    @Operation(summary = "Verify or reject a student document")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> verifyDocument(
            @PathVariable Long id,
            @PathVariable Long documentId,
            @Valid @RequestBody VerifyDocumentRequest request) {

        Long tenantId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Document status updated",
                admissionService.verifyDocument(tenantId, id, documentId, request)));
    }
}
