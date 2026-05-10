package com.sms.school.controller;

import com.sms.school.dto.request.MarkAttendanceRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.AttendanceResponse;
import com.sms.school.repository.TeacherRepository;
import com.sms.school.security.TenantContext;
import com.sms.school.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Mark and view student attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final TeacherRepository teacherRepository;

    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN')")
    @Operation(summary = "Mark attendance for a section on a given date")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();

        // Resolve teacher profile from logged-in user
        Long userId = TenantContext.getCurrentUserId();
        Long teacherId = teacherRepository.findByUserId(userId)
                .map(t -> t.getId())
                .orElse(null);   // null when admin (not a teacher) marks attendance

        List<AttendanceResponse> result =
                attendanceService.markAttendance(schoolId, teacherId, request);
        return ResponseEntity.ok(ApiResponse.success("Attendance marked", result));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get attendance for a section on a specific date")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getSectionAttendance(
            @PathVariable Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<AttendanceResponse> result =
                attendanceService.getSectionAttendance(schoolId, sectionId, date);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get attendance records for a student in a date range")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getStudentAttendance(
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<AttendanceResponse> result =
                attendanceService.getStudentAttendance(schoolId, studentId, from, to);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/student/{studentId}/percentage")
    @Operation(summary = "Get attendance percentage for a student in a date range")
    public ResponseEntity<ApiResponse<Double>> getAttendancePercentage(
            @PathVariable Long studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        double pct = attendanceService.getAttendancePercentage(schoolId, studentId, from, to);
        return ResponseEntity.ok(ApiResponse.success("Attendance percentage", pct));
    }
}
