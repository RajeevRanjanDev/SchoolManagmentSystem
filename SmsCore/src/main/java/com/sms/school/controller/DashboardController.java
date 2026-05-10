package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.DashboardResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Admin dashboard summary statistics")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get school overview statistics")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getAdminDashboard(schoolId)));
    }
}
