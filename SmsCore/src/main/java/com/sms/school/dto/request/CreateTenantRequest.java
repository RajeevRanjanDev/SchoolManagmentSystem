package com.sms.school.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Payload for SUPER_ADMIN to create a new school tenant.
 * Step 1 of the onboarding flow.
 */
@Data
public class CreateTenantRequest {

    @NotBlank(message = "School name is required")
    private String name;

    private String legalName;

    @NotBlank(message = "School code is required (e.g. DPS-NOIDA)")
    @Size(min = 3, max = 20)
    @Pattern(regexp = "^[A-Z0-9\\-]+$", message = "Code must be uppercase alphanumeric with hyphens only")
    private String code;

    private String address;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String phone;
    private String mobile;

    @Email(message = "Valid email required")
    private String email;

    private String website;
    private String logoUrl;

    /** Plan code from subscription_plans.plan_code. Defaults to TRIAL if omitted. */
    private String planCode;

    /** Initial status. Defaults to TRIAL. Super admin may set ACTIVE directly. */
    private String status;

    private String currentAcademicYear;

    // ── Branding (optional, set during creation or later via PUT /branding) ────
    private String primaryColor;
    private String secondaryColor;
    private String tagline;

    // ── First school admin account (optional, can be done later via POST /admin) ─
    private String adminFirstName;
    private String adminLastName;

    @Email(message = "Valid admin email required")
    private String adminEmail;

    private String adminPassword;
    private String adminMobile;
}
