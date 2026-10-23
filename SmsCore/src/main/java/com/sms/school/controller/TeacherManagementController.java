package com.sms.school.controller;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.security.TenantContext;
import com.sms.school.service.TeacherManagementService;
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
 * Admin-facing endpoints: manage teachers, subjects and their class/section/subject assignments.
 *
 * Base: /api/v1/admin
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Teacher Management (Admin)", description = "CRUD for teachers, subjects, and assignments")
public class TeacherManagementController {

    private final TeacherManagementService teacherService;

    // ── Teachers ──────────────────────────────────────────────────────────────

    @PostMapping("/teachers")
    @Operation(summary = "Create a new teacher (optionally creates a login account)")
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(
            @Valid @RequestBody CreateTeacherRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        TeacherResponse response = teacherService.createTeacher(schoolId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Teacher created successfully", response));
    }

    @PutMapping("/teachers/{teacherId}")
    @Operation(summary = "Update teacher profile")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable Long teacherId,
            @Valid @RequestBody CreateTeacherRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                teacherService.updateTeacher(schoolId, teacherId, request)));
    }

    @GetMapping("/teachers/{teacherId}")
    @Operation(summary = "Get teacher by ID")
    public ResponseEntity<ApiResponse<TeacherResponse>> getTeacher(
            @PathVariable Long teacherId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                teacherService.getTeacher(schoolId, teacherId)));
    }

    @PostMapping("/teachers/{teacherId}/reset-password")
    @Operation(summary = "Generate a temporary password for the employee and email it")
    public ResponseEntity<ApiResponse<Void>> resetTeacherPassword(@PathVariable Long teacherId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        String email = teacherService.resetTeacherPassword(schoolId, teacherId);
        return ResponseEntity.ok(ApiResponse.success(
                "Temporary password emailed to " + email, null));
    }

    @GetMapping("/teachers")
    @Operation(summary = "List all teachers in this school")
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getAllTeachers() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(teacherService.getAllTeachers(schoolId)));
    }

    @DeleteMapping("/teachers/{teacherId}")
    @Operation(summary = "Soft-delete a teacher")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long teacherId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        teacherService.deleteTeacher(schoolId, teacherId);
        return ResponseEntity.ok(ApiResponse.success("Teacher deleted", null));
    }

    @PatchMapping("/teachers/{teacherId}/status")
    @Operation(summary = "Update teacher status (ACTIVE | INACTIVE | ON_LEAVE | RESIGNED)")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacherStatus(
            @PathVariable Long teacherId,
            @RequestParam String status) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                "Teacher status updated", teacherService.updateTeacherStatus(schoolId, teacherId, status)));
    }

    // ── Subjects ──────────────────────────────────────────────────────────────

    @PostMapping("/subjects")
    @Operation(summary = "Create a subject master record")
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(
            @Valid @RequestBody CreateSubjectRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Subject created", teacherService.createSubject(schoolId, request)));
    }

    @GetMapping("/subjects")
    @Operation(summary = "List all subjects for this school")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAllSubjects() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(teacherService.getAllSubjects(schoolId)));
    }

    @PutMapping("/subjects/{subjectId}")
    @Operation(summary = "Update a subject")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable Long subjectId,
            @Valid @RequestBody CreateSubjectRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                teacherService.updateSubject(schoolId, subjectId, request)));
    }

    @DeleteMapping("/subjects/{subjectId}")
    @Operation(summary = "Soft-delete a subject")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable Long subjectId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        teacherService.deleteSubject(schoolId, subjectId);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted", null));
    }

    // ── Teacher Assignments ───────────────────────────────────────────────────

    @PostMapping("/teachers/{teacherId}/assignments")
    @Operation(summary = "Assign teacher to class/section/subject for an academic year")
    public ResponseEntity<ApiResponse<TeacherAssignmentResponse>> assignTeacher(
            @PathVariable Long teacherId,
            @Valid @RequestBody AssignTeacherRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Assignment created", teacherService.assignTeacher(schoolId, teacherId, request)));
    }

    @GetMapping("/teachers/{teacherId}/assignments")
    @Operation(summary = "Get all assignments for a teacher (optionally filtered by academic year)")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentResponse>>> getTeacherAssignments(
            @PathVariable Long teacherId,
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                teacherService.getTeacherAssignments(schoolId, teacherId, academicYear)));
    }

    @GetMapping("/sections/{sectionId}/assignments")
    @Operation(summary = "Get all teacher assignments for a section")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentResponse>>> getSectionAssignments(
            @PathVariable Long sectionId,
            @RequestParam String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                teacherService.getSectionAssignments(schoolId, sectionId, academicYear)));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    @Operation(summary = "Remove a teacher assignment")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(@PathVariable Long assignmentId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        teacherService.removeAssignment(schoolId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Assignment removed", null));
    }

    @PatchMapping("/assignments/{assignmentId}/class-teacher")
    @Operation(summary = "Set or unset a teacher as class teacher for the assignment's section")
    public ResponseEntity<ApiResponse<Void>> setClassTeacher(
            @PathVariable Long assignmentId,
            @RequestParam boolean isClassTeacher) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        teacherService.setClassTeacher(schoolId, assignmentId, isClassTeacher);
        return ResponseEntity.ok(ApiResponse.success(
                isClassTeacher ? "Class teacher set" : "Class teacher unset", null));
    }
}
