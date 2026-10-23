package com.sms.school.controller;

import com.sms.school.dto.request.CreateStudentRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.StudentResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Student management")
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create a new student")
    public ResponseEntity<ApiResponse<StudentResponse>> create(
            @Valid @RequestBody CreateStudentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentResponse response = studentService.createStudent(schoolId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER')")
    @Operation(summary = "List all students in the school (paginated)")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getAll(
            @PageableDefault(size = 20) Pageable pageable) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Page<StudentResponse> page = studentService.getAllStudents(schoolId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a student by ID")
    public ResponseEntity<ApiResponse<StudentResponse>> getById(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentResponse response = studentService.getStudentById(schoolId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/by-parent/{parentId}")
    @Operation(summary = "Get all students linked to a parent")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getByParent(
            @PathVariable Long parentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<StudentResponse> list = studentService.getStudentsByParent(schoolId, parentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update a student's details")
    public ResponseEntity<ApiResponse<StudentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateStudentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentResponse response = studentService.updateStudent(schoolId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Student updated", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Toggle a student's active/inactive status")
    public ResponseEntity<ApiResponse<StudentResponse>> toggleStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        StudentResponse response = studentService.toggleStudentStatus(schoolId, id, active);
        return ResponseEntity.ok(ApiResponse.success(
                active ? "Student activated" : "Student deactivated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Soft-delete a student")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        studentService.deleteStudent(schoolId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
