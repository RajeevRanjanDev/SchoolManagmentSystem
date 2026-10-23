package com.sms.school.service.template;

import com.sms.school.entity.enums.InstitutionType;
import com.sms.school.entity.template.InstitutionTemplate;
import com.sms.school.entity.template.TenantTemplate;

public interface TemplateService {

    /**
     * Apply the default template for the given institution type to a newly created tenant.
     * Creates default roles, permissions, academic structure config, and fee components.
     * Idempotent — safe to call again on failure; existing records are not duplicated.
     *
     * @param tenantId       ID of the newly created school/tenant
     * @param institutionType type selected during tenant onboarding
     * @param appliedBy      username of the user who created the tenant
     * @return TenantTemplate record confirming the applied template
     */
    TenantTemplate applyTemplate(Long tenantId, InstitutionType institutionType, String appliedBy);

    InstitutionTemplate getTemplate(InstitutionType type);
    TenantTemplate getTenantTemplate(Long tenantId);
}
