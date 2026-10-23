package com.sms.school.controller;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import com.sms.school.service.TenantManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Platform-level admin endpoints — SUPER_ADMIN only.
 *
 * Base URL: /api/v1/super
 *
 * These endpoints are NOT tenant-scoped. Super admin explicitly provides
 * schoolId as a path variable when operating on a specific school.
 *
 * Data isolation rule: these endpoints deliberately bypass TenantContext
 * because the super admin has cross-tenant authority.
 */
@RestController
@RequestMapping("/api/v1/super")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin", description = "Platform administration — SUPER_ADMIN only")
public class SuperAdminController {

    private final TenantManagementService tenantService;

    // ── Tenant management ─────────────────────────────────────────────────────

    @PostMapping("/schools")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new school tenant")
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        TenantResponse tenant = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("School tenant created successfully", tenant));
    }

    @GetMapping("/schools")
    @Operation(summary = "List all school tenants (paginated, filterable)")
    public ResponseEntity<ApiResponse<Page<TenantResponse>>> listTenants(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<TenantResponse> tenants = tenantService.listTenants(
                status, search,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }

    @GetMapping("/schools/{schoolId}")
    @Operation(summary = "Get tenant detail with usage stats")
    public ResponseEntity<ApiResponse<TenantResponse>> getTenant(
            @PathVariable Long schoolId) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getTenantStats(schoolId)));
    }

    @PutMapping("/schools/{schoolId}")
    @Operation(summary = "Update tenant info (name, contact, address)")
    public ResponseEntity<ApiResponse<TenantResponse>> updateTenant(
            @PathVariable Long schoolId,
            @Valid @RequestBody CreateTenantRequest request) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.updateTenant(schoolId, request)));
    }

    @PutMapping("/schools/{schoolId}/config")
    @Operation(summary = "Update legal identity, affiliation, signatory, receipt & communication config")
    public ResponseEntity<ApiResponse<TenantResponse>> updateConfig(
            @PathVariable Long schoolId,
            @Valid @RequestBody UpdateSchoolConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("School configuration updated",
                tenantService.updateSchoolConfig(schoolId, request)));
    }

    @GetMapping("/schools/{schoolId}/history")
    @Operation(summary = "Change/audit history for a school")
    public ResponseEntity<ApiResponse<java.util.List<TenantAuditResponse>>> getHistory(
            @PathVariable Long schoolId) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getSchoolHistory(schoolId)));
    }

    @GetMapping("/schools/{schoolId}/export")
    @Operation(summary = "Export a school's profile, config and history as JSON")
    public ResponseEntity<java.util.Map<String, Object>> exportSchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"school-" + schoolId + "-export.json\"")
                .body(tenantService.exportSchool(schoolId));
    }

    @PatchMapping("/schools/{schoolId}/status")
    @Operation(summary = "Change tenant status: TRIAL | ACTIVE | SUSPENDED | TERMINATED")
    public ResponseEntity<ApiResponse<TenantResponse>> updateStatus(
            @PathVariable Long schoolId,
            @Valid @RequestBody UpdateTenantStatusRequest request) {
        TenantResponse updated = tenantService.updateStatus(schoolId, request);
        return ResponseEntity.ok(ApiResponse.success(
                "School status updated to " + request.getStatus(), updated));
    }

    // ── School admin creation ─────────────────────────────────────────────────

    @PostMapping("/schools/{schoolId}/admin")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a SCHOOL_ADMIN user for the given tenant")
    public ResponseEntity<ApiResponse<Void>> createSchoolAdmin(
            @PathVariable Long schoolId,
            @Valid @RequestBody CreateSchoolAdminRequest request) {
        tenantService.createSchoolAdmin(schoolId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("School admin created", null));
    }

    @GetMapping("/schools/{schoolId}/admins")
    @Operation(summary = "List SCHOOL_ADMIN accounts for a tenant")
    public ResponseEntity<ApiResponse<java.util.List<SchoolAdminResponse>>> listAdmins(
            @PathVariable Long schoolId) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listSchoolAdmins(schoolId)));
    }

    @PostMapping("/schools/{schoolId}/admins/{userId}/reset-password")
    @Operation(summary = "Reset a school admin's password and email a temporary one")
    public ResponseEntity<ApiResponse<Void>> resetAdminPassword(
            @PathVariable Long schoolId, @PathVariable Long userId) {
        String email = tenantService.resetAdminPassword(schoolId, userId);
        return ResponseEntity.ok(ApiResponse.success("Temporary password emailed to " + email, null));
    }

    @PatchMapping("/schools/{schoolId}/admins/{userId}/status")
    @Operation(summary = "Activate or deactivate a school admin account")
    public ResponseEntity<ApiResponse<SchoolAdminResponse>> setAdminStatus(
            @PathVariable Long schoolId, @PathVariable Long userId,
            @RequestParam boolean active) {
        return ResponseEntity.ok(ApiResponse.success(
                active ? "Admin activated" : "Admin deactivated",
                tenantService.setAdminActive(schoolId, userId, active)));
    }

    // ── Subscription management ───────────────────────────────────────────────

    @PostMapping("/schools/{schoolId}/subscription")
    @Operation(summary = "Assign or change subscription plan for a tenant")
    public ResponseEntity<ApiResponse<TenantResponse>> assignSubscription(
            @PathVariable Long schoolId,
            @Valid @RequestBody AssignSubscriptionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                tenantService.assignSubscription(schoolId, request)));
    }

    @PostMapping("/schools/{schoolId}/subscription/renew")
    @Operation(summary = "Renew a subscription by N months (extends expiry, reactivates)")
    public ResponseEntity<ApiResponse<TenantResponse>> renewSubscription(
            @PathVariable Long schoolId, @RequestParam(defaultValue = "12") int months) {
        return ResponseEntity.ok(ApiResponse.success("Subscription renewed",
                tenantService.renewSubscription(schoolId, months)));
    }

    // ── Billing ───────────────────────────────────────────────────────────────

    @GetMapping("/schools/{schoolId}/invoices")
    @Operation(summary = "List subscription invoices for a school")
    public ResponseEntity<ApiResponse<java.util.List<InvoiceResponse>>> listInvoices(@PathVariable Long schoolId) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listInvoices(schoolId)));
    }

    @PostMapping("/schools/{schoolId}/invoices")
    @Operation(summary = "Issue a subscription invoice to a school")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @PathVariable Long schoolId, @Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Invoice created",
                tenantService.createInvoice(schoolId, request)));
    }

    @PatchMapping("/schools/{schoolId}/invoices/{invoiceId}/paid")
    @Operation(summary = "Mark an invoice as paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markInvoicePaid(
            @PathVariable Long schoolId, @PathVariable Long invoiceId) {
        return ResponseEntity.ok(ApiResponse.success("Invoice marked paid",
                tenantService.markInvoicePaid(schoolId, invoiceId)));
    }

    // ── Plan management ───────────────────────────────────────────────────────

    @GetMapping("/all-plans")
    @Operation(summary = "List all subscription plans (including inactive)")
    public ResponseEntity<ApiResponse<java.util.List<PlanResponse>>> listAllPlans() {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listAllPlans()));
    }

    @PostMapping("/plans")
    @Operation(summary = "Create or update a subscription plan")
    public ResponseEntity<ApiResponse<PlanResponse>> upsertPlan(@Valid @RequestBody UpsertPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Plan saved", tenantService.upsertPlan(request)));
    }

    // ── Branding management ───────────────────────────────────────────────────

    @PutMapping("/schools/{schoolId}/branding")
    @Operation(summary = "Update tenant branding (logo, colors, tagline)")
    public ResponseEntity<ApiResponse<BrandingResponse>> updateBranding(
            @PathVariable Long schoolId,
            @RequestBody UpdateTenantBrandingRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                tenantService.updateBranding(schoolId, request)));
    }

    @GetMapping("/schools/{schoolId}/branding")
    @Operation(summary = "Get tenant branding")
    public ResponseEntity<ApiResponse<BrandingResponse>> getBranding(
            @PathVariable Long schoolId) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getBranding(schoolId)));
    }

    // ── Platform statistics ───────────────────────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Platform-wide statistics for Super Admin dashboard")
    public ResponseEntity<ApiResponse<PlatformStatsResponse>> getPlatformStats() {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getPlatformStats()));
    }

    @GetMapping("/plans")
    @Operation(summary = "List active subscription plans")
    public ResponseEntity<ApiResponse<java.util.List<PlanResponse>>> listPlans() {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listPlans()));
    }

    @GetMapping("/schools/alerts")
    @Operation(summary = "Schools in a red/alert state (usage ≥ 90% or subscription expiring/expired)")
    public ResponseEntity<ApiResponse<java.util.List<TenantResponse>>> alertSchools() {
        return ResponseEntity.ok(ApiResponse.success(tenantService.listAlertSchools()));
    }
}
