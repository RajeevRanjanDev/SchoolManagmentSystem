package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.enums.InstitutionType;
import com.sms.school.entity.template.InstitutionTemplate;
import com.sms.school.entity.template.TenantTemplate;
import com.sms.school.security.TenantContext;
import com.sms.school.service.template.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    /**
     * NEW — get the full template definition for a given institution type.
     * Used during tenant onboarding to preview roles/permissions/fee-structure.
     */
    @GetMapping("/{institutionType}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<InstitutionTemplate> getTemplate(@PathVariable InstitutionType institutionType) {
        return ApiResponse.success("Template fetched", templateService.getTemplate(institutionType));
    }

    /**
     * NEW — apply template to the current tenant.
     * Called once during onboarding; idempotent.
     */
    @PostMapping("/apply")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<TenantTemplate> applyTemplate(
            @RequestParam InstitutionType institutionType,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long tenantId = TenantContext.getCurrentSchoolId();
        TenantTemplate result = templateService.applyTemplate(tenantId, institutionType, userDetails.getUsername());
        return ApiResponse.success("Template applied successfully", result);
    }

    /**
     * NEW — get the applied template for the current tenant.
     */
    @GetMapping("/current")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<TenantTemplate> getCurrentTemplate() {
        Long tenantId = TenantContext.getCurrentSchoolId();
        return ApiResponse.success("Tenant template fetched", templateService.getTenantTemplate(tenantId));
    }
}
