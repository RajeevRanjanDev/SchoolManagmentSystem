package com.sms.school.controller;

import com.sms.school.dto.request.employee.AssignEmployeeRequest;
import com.sms.school.dto.request.employee.CreateEmployeeRequest;
import com.sms.school.dto.request.employee.UpdateEmployeeRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.employee.EmployeeResponse;
import com.sms.school.dto.response.employee.EmployeeSummaryResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.employee.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    /** NEW — register a new employee */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    public ApiResponse<EmployeeResponse> create(
            @Valid @RequestBody CreateEmployeeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        EmployeeResponse response = employeeService.create(tenantId, request, userDetails.getUsername());
        return ApiResponse.success("Employee registered successfully", response);
    }

    /** NEW — paginated employee list with optional status / search filters */
    @GetMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN','HR_MANAGER')")
    public ApiResponse<Page<EmployeeSummaryResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        Page<EmployeeSummaryResponse> result = employeeService.list(
                tenantId, status, search,
                PageRequest.of(page, size, Sort.by("firstName")));
        return ApiResponse.success("Employees fetched", result);
    }

    /** NEW — get single employee with full details */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<EmployeeResponse> getById(@PathVariable Long id) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ApiResponse.success("Employee fetched", employeeService.getById(tenantId, id));
    }

    /** MODIFIED — update employee profile (was Teacher.update in school module) */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    public ApiResponse<EmployeeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ApiResponse.success("Employee updated", employeeService.update(tenantId, id, request, userDetails.getUsername()));
    }

    /** NEW — assign employee to class/program/batch */
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    public ApiResponse<Void> assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignEmployeeRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        employeeService.assignToAcademic(tenantId, id, request, userDetails.getUsername());
        return ApiResponse.success("Assignment created successfully", null);
    }

    /** NEW — upload a document for an employee */
    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN','PRINCIPAL','DEAN')")
    public ApiResponse<Void> uploadDocument(
            @PathVariable Long id,
            @RequestParam String documentType,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        employeeService.uploadDocument(tenantId, id, documentType, file, userDetails.getUsername());
        return ApiResponse.success("Document uploaded", null);
    }

    /** NEW — terminate an employee */
    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    public ApiResponse<Void> terminate(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        employeeService.terminate(tenantId, id, reason, userDetails.getUsername());
        return ApiResponse.success("Employee terminated", null);
    }
}
