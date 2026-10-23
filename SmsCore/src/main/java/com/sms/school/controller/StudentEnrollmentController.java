package com.sms.school.controller;

import com.sms.school.dto.request.EnrollStudentRequest;
import com.sms.school.dto.request.LinkParentRequest;
import com.sms.school.dto.request.PromoteStudentRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.EnrollmentResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.StudentEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students/{studentId}")
@RequiredArgsConstructor
@Tag(name = "Student Enrollment", description = "Assign class, promote, transfer, link parents")
public class StudentEnrollmentController {

    private final StudentEnrollmentService enrollmentService;

    // ── Enroll (assign to class for the first time this year) ─────────

    @PostMapping("/enroll")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Assign student to a class/section for an academic year")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(
            @PathVariable Long studentId,
            @Valid @RequestBody EnrollStudentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        EnrollmentResponse response = enrollmentService.enrollStudent(schoolId, studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student enrolled successfully", response));
    }

    // ── Promote (end of year → next class) ────────────────────────────

    @PostMapping("/promote")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Promote student to next class and academic year")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> promote(
            @PathVariable Long studentId,
            @Valid @RequestBody PromoteStudentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        EnrollmentResponse response = enrollmentService.promoteStudent(schoolId, studentId, request);
        return ResponseEntity.ok(ApiResponse.success("Student promoted successfully", response));
    }

    // ── Transfer section (same year) ──────────────────────────────────

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Transfer student to a different section within the same year")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> transfer(
            @PathVariable Long studentId,
            @Valid @RequestBody EnrollStudentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        EnrollmentResponse response = enrollmentService.transferSection(schoolId, studentId, request);
        return ResponseEntity.ok(ApiResponse.success("Student transferred successfully", response));
    }

    // ── Enrollment history ────────────────────────────────────────────

    @GetMapping("/enrollments")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER')")
    @Operation(summary = "Get full enrollment history for a student across all years")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getHistory(
            @PathVariable Long studentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<EnrollmentResponse> history = enrollmentService.getEnrollmentHistory(schoolId, studentId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // ── Current active enrollment ─────────────────────────────────────

    @GetMapping("/enrollment")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT')")
    @Operation(summary = "Get current active enrollment for a student")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> getActive(
            @PathVariable Long studentId,
            @RequestParam String year) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        EnrollmentResponse enrollment = enrollmentService.getActiveEnrollment(schoolId, studentId, year);
        return ResponseEntity.ok(ApiResponse.success(enrollment));
    }

    // ── Link parent ───────────────────────────────────────────────────

    @PostMapping("/link-parent")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Link a parent/guardian to this student")
    public ResponseEntity<ApiResponse<Void>> linkParent(
            @PathVariable Long studentId,
            @Valid @RequestBody LinkParentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        enrollmentService.linkParent(schoolId, studentId, request);
        return ResponseEntity.ok(ApiResponse.success("Parent linked successfully", null));
    }

    // ── Unlink parent ─────────────────────────────────────────────────

    @DeleteMapping("/unlink-parent/{parentId}")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Unlink a parent/guardian from this student")
    public ResponseEntity<ApiResponse<Void>> unlinkParent(
            @PathVariable Long studentId,
            @PathVariable Long parentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        enrollmentService.unlinkParent(schoolId, studentId, parentId);
        return ResponseEntity.ok(ApiResponse.success("Parent unlinked", null));
    }
}
