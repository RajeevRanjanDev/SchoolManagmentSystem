package com.sms.school.controller;

import com.sms.school.dto.request.SubmitHomeworkRequest;
import com.sms.school.dto.response.*;
import com.sms.school.security.TenantContext;
import com.sms.school.service.ParentDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parent")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Parent Dashboard", description = "Parent-facing APIs — child data, attendance, homework, marks, fees")
public class ParentDashboardController {

    private final ParentDashboardService parentDashboardService;

    // ── My children ───────────────────────────────────────────────────

    @GetMapping("/children")
    @Operation(summary = "List all children linked to the logged-in parent")
    public ResponseEntity<ApiResponse<List<ChildSummaryResponse>>> getMyChildren(
            @RequestParam(required = false) String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        List<ChildSummaryResponse> children =
                parentDashboardService.getMyChildren(schoolId, userId, academicYear);
        return ResponseEntity.ok(ApiResponse.success(children));
    }

    // ── Attendance ────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/attendance")
    @Operation(summary = "Monthly attendance for a child (month = yyyy-MM, e.g. 2025-06)")
    public ResponseEntity<ApiResponse<MonthlyAttendanceResponse>> getAttendance(
            @PathVariable Long studentId,
            @RequestParam String month) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        MonthlyAttendanceResponse attendance =
                parentDashboardService.getAttendance(schoolId, userId, studentId, month);
        return ResponseEntity.ok(ApiResponse.success(attendance));
    }

    // ── Homework ──────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/homework")
    @Operation(summary = "Homework list for a child with submission status")
    public ResponseEntity<ApiResponse<List<HomeworkWithSubmissionResponse>>> getHomework(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        List<HomeworkWithSubmissionResponse> homework =
                parentDashboardService.getHomework(schoolId, userId, studentId, academicYear);
        return ResponseEntity.ok(ApiResponse.success(homework));
    }

    @PostMapping("/children/{studentId}/homework/{homeworkId}/submit")
    @Operation(summary = "Submit homework on behalf of a child")
    public ResponseEntity<ApiResponse<Void>> submitHomework(
            @PathVariable Long studentId,
            @PathVariable Long homeworkId,
            @Valid @RequestBody SubmitHomeworkRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        parentDashboardService.submitHomework(schoolId, userId, studentId, homeworkId, request);
        return ResponseEntity.ok(ApiResponse.success("Homework submitted successfully", null));
    }

    // ── Results / Marks ───────────────────────────────────────────────

    @GetMapping("/children/{studentId}/results")
    @Operation(summary = "Published exam results for a child")
    public ResponseEntity<ApiResponse<List<ResultResponse>>> getResults(
            @PathVariable Long studentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        List<ResultResponse> results =
                parentDashboardService.getResults(schoolId, userId, studentId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // ── Fees ──────────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/fees")
    @Operation(summary = "Fee records for a child for a given academic year")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getFees(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        List<FeeResponse> fees =
                parentDashboardService.getFees(schoolId, userId, studentId, academicYear);
        return ResponseEntity.ok(ApiResponse.success(fees));
    }

    // ── Teachers / Subjects for child ─────────────────────────────────────────

    @GetMapping("/children/{studentId}/teachers")
    @Operation(summary = "Get all subject teachers for a child's current section")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentResponse>>> getChildTeachers(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                parentDashboardService.getChildTeachers(schoolId, userId, studentId, academicYear)));
    }

    // ── Classwork ─────────────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/classwork")
    @Operation(summary = "Get classwork entries for a child's current section")
    public ResponseEntity<ApiResponse<List<ClassworkResponse>>> getClasswork(
            @PathVariable Long studentId,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                parentDashboardService.getClasswork(schoolId, userId, studentId, academicYear)));
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @GetMapping("/children/{studentId}/announcements")
    @Operation(summary = "Get class/section announcements for a child")
    public ResponseEntity<ApiResponse<List<ClassAnnouncementResponse>>> getAnnouncements(
            @PathVariable Long studentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                parentDashboardService.getAnnouncements(schoolId, userId, studentId)));
    }
}
