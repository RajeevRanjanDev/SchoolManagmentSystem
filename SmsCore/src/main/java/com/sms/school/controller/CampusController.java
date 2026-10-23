package com.sms.school.controller;

import com.sms.school.dto.request.CreateCampusRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.CampusResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.CampusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campuses")
@RequiredArgsConstructor
public class CampusController {

    private final CampusService campusService;

    /** NEW — create a campus under the current tenant */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    public ApiResponse<CampusResponse> create(
            @Valid @RequestBody CreateCampusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ApiResponse.success("Campus created", campusService.create(tenantId, request, userDetails.getUsername()));
    }

    /** NEW — list all campuses for the current tenant */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CampusResponse>> list() {
        return ApiResponse.success("Campuses fetched", campusService.listAll(TenantContext.getCurrentSchoolId()));
    }

    /** NEW — get a single campus by ID */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CampusResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Campus fetched", campusService.getById(TenantContext.getCurrentSchoolId(), id));
    }

    /** NEW — deactivate a campus (cannot deactivate main campus) */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN','SUPER_ADMIN')")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        campusService.deactivate(TenantContext.getCurrentSchoolId(), id);
        return ApiResponse.success("Campus deactivated", null);
    }
}
