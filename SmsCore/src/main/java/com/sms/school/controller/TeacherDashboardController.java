package com.sms.school.controller;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.security.TenantContext;
import com.sms.school.service.TeacherDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Teacher-facing endpoints. Every operation is scoped to the logged-in teacher's
 * assignment mappings — teachers cannot post to classes they don't teach.
 *
 * Base: /api/v1/teacher
 *
 * Endpoint summary:
 *   GET  /teacher/dashboard                          — full dashboard payload
 *   GET  /teacher/my-assignments                     — list of assigned class/section/subjects
 *   POST /teacher/homework                           — create homework
 *   GET  /teacher/homework?sectionId=&academicYear=  — my homework for a section
 *   POST /teacher/classwork                          — create classwork
 *   GET  /teacher/classwork?sectionId=&academicYear= — my classwork for a section
 *   POST /teacher/attendance                         — bulk mark attendance
 *   POST /teacher/marks                              — bulk enter marks
 *   POST /teacher/announcements                      — post class announcement
 *   GET  /teacher/announcements                      — my announcements
 */
@RestController
@RequestMapping("/api/v1/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Teacher Dashboard", description = "Teacher-facing APIs — work assignments, homework, classwork, attendance, marks")
public class TeacherDashboardController {

    private final TeacherDashboardService dashboardService;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "Full teacher dashboard — assignments, summary stats")
    public ResponseEntity<ApiResponse<TeacherDashboardResponse>> getDashboard(
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyDashboard(schoolId, userId, academicYear)));
    }

    // ── My Assignments ────────────────────────────────────────────────────────

    @GetMapping("/my-assignments")
    @Operation(summary = "List all class/section/subject assignments for the logged-in teacher")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentResponse>>> getMyAssignments(
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyAssignments(schoolId, userId, academicYear)));
    }

    @GetMapping("/my-class-sections")
    @Operation(summary = "Sections the logged-in teacher is class teacher of (scope for class operations)")
    public ResponseEntity<ApiResponse<List<TeacherDashboardResponse.ClassTeacherSection>>> getMyClassSections(
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyClassSections(schoolId, userId, academicYear)));
    }

    @GetMapping("/students/{studentId}")
    @Operation(summary = "Read-only student profile (guardians, address, details) for the class teacher")
    public ResponseEntity<ApiResponse<TeacherStudentCardResponse>> getStudentCard(@PathVariable Long studentId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStudentCard(schoolId, studentId)));
    }

    // ── Homework ──────────────────────────────────────────────────────────────

    @PostMapping("/homework")
    @Operation(summary = "Create homework for an assigned class/section/subject")
    public ResponseEntity<ApiResponse<HomeworkWithSubmissionResponse>> createHomework(
            @Valid @RequestBody CreateHomeworkRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Homework created", dashboardService.createHomework(schoolId, userId, request)));
    }

    @GetMapping("/homework")
    @Operation(summary = "Get homework created by this teacher for a section")
    public ResponseEntity<ApiResponse<List<HomeworkWithSubmissionResponse>>> getMyHomework(
            @RequestParam Long sectionId,
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyHomework(schoolId, userId, sectionId, academicYear)));
    }

    // ── Classwork ─────────────────────────────────────────────────────────────

    @PostMapping("/classwork")
    @Operation(summary = "Create classwork / lesson record for an assigned class/section/subject")
    public ResponseEntity<ApiResponse<ClassworkResponse>> createClasswork(
            @Valid @RequestBody CreateClassworkRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Classwork created", dashboardService.createClasswork(schoolId, userId, request)));
    }

    @GetMapping("/classwork")
    @Operation(summary = "Get classwork created by this teacher for a section")
    public ResponseEntity<ApiResponse<List<ClassworkResponse>>> getMyClasswork(
            @RequestParam Long sectionId,
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyClasswork(schoolId, userId, sectionId, academicYear)));
    }

    // ── Attendance ────────────────────────────────────────────────────────────

    @PostMapping("/attendance")
    @Operation(summary = "Bulk mark attendance for a section on a given date")
    public ResponseEntity<ApiResponse<Void>> markAttendance(
            @Valid @RequestBody BulkAttendanceRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        dashboardService.markAttendance(schoolId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Attendance marked successfully", null));
    }

    // ── Marks ─────────────────────────────────────────────────────────────────

    @PostMapping("/marks")
    @Operation(summary = "Bulk enter / update marks for all students in an exam")
    public ResponseEntity<ApiResponse<Void>> enterMarks(
            @Valid @RequestBody BulkMarksRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        dashboardService.enterMarks(schoolId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Marks saved successfully", null));
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @PostMapping("/announcements")
    @Operation(summary = "Post an announcement to a class/section")
    public ResponseEntity<ApiResponse<ClassAnnouncementResponse>> createAnnouncement(
            @Valid @RequestBody CreateClassAnnouncementRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Announcement posted", dashboardService.createAnnouncement(schoolId, userId, request)));
    }

    @GetMapping("/announcements")
    @Operation(summary = "Get all announcements posted by this teacher")
    public ResponseEntity<ApiResponse<List<ClassAnnouncementResponse>>> getMyAnnouncements() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMyAnnouncements(schoolId, userId)));
    }
}
