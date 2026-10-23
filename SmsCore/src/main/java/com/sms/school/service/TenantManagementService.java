package com.sms.school.service;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Platform-level tenant management — SUPER_ADMIN only.
 *
 * All methods must:
 *  1. Be called only from SuperAdminController (@PreAuthorize SUPER_ADMIN)
 *  2. Write an audit log entry for every mutation
 *  3. Evict TenantStatusChecker cache after status changes
 */
public interface TenantManagementService {

    // ── Tenant CRUD ───────────────────────────────────────────────────────────

    /**
     * Full school creation flow:
     *  1. Create school record
     *  2. Create tenant_branding
     *  3. Assign subscription plan
     *  4. Optionally create first SCHOOL_ADMIN user
     *  5. Seed default roles + permissions for the new tenant
     *  6. Write audit log
     */
    TenantResponse createTenant(CreateTenantRequest request);

    TenantResponse getTenant(Long schoolId);

    Page<TenantResponse> listTenants(String status, String search, Pageable pageable);

    TenantResponse updateTenant(Long schoolId, CreateTenantRequest request);

    TenantResponse updateSchoolConfig(Long schoolId, UpdateSchoolConfigRequest request);

    java.util.List<TenantAuditResponse> getSchoolHistory(Long schoolId);

    java.util.Map<String, Object> exportSchool(Long schoolId);

    /**
     * Status transition: TRIAL → ACTIVE → SUSPENDED → TERMINATED.
     * Evicts cache. Writes audit log with old/new status.
     */
    TenantResponse updateStatus(Long schoolId, UpdateTenantStatusRequest request);

    // ── School admin management ────────────────────────────────────────────────

    /** Creates a SCHOOL_ADMIN user for the given tenant. */
    void createSchoolAdmin(Long schoolId, CreateSchoolAdminRequest request);

    java.util.List<SchoolAdminResponse> listSchoolAdmins(Long schoolId);

    String resetAdminPassword(Long schoolId, Long userId);

    SchoolAdminResponse setAdminActive(Long schoolId, Long userId, boolean active);

    // ── Subscription management ───────────────────────────────────────────────

    TenantResponse assignSubscription(Long schoolId, AssignSubscriptionRequest request);

    TenantResponse renewSubscription(Long schoolId, int months);

    java.util.List<InvoiceResponse> listInvoices(Long schoolId);

    InvoiceResponse createInvoice(Long schoolId, CreateInvoiceRequest request);

    InvoiceResponse markInvoicePaid(Long schoolId, Long invoiceId);

    java.util.List<PlanResponse> listAllPlans();

    PlanResponse upsertPlan(UpsertPlanRequest request);

    // ── Branding management ───────────────────────────────────────────────────

    BrandingResponse updateBranding(Long schoolId, UpdateTenantBrandingRequest request);

    BrandingResponse getBranding(Long schoolId);

    // ── Stats ─────────────────────────────────────────────────────────────────

    PlatformStatsResponse getPlatformStats();

    java.util.List<PlanResponse> listPlans();

    /** Schools in a red/alert state: usage ≥ 90% of plan, or subscription expiring/expired. */
    java.util.List<TenantResponse> listAlertSchools();

    TenantResponse getTenantStats(Long schoolId);
}
