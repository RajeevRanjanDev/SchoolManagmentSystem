package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Response for GET /api/v1/me/profile
 *
 * Returned immediately after login so the app can show:
 *  - correct school name / logo / branding
 *  - user's role and name
 *  - navigation structure appropriate to the role
 *
 * No additional API call needed for branding — it's all here.
 */
@Data
@Builder
public class UserProfileResponse {

    // ── User identity ─────────────────────────────────────────────────────────
    private Long   userId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String mobile;
    private String profilePictureUrl;
    private String userType;    // SUPER_ADMIN | SCHOOL_USER
    private String role;        // SCHOOL_ADMIN | TEACHER | PARENT | ...

    // ── School / Tenant (null for SUPER_ADMIN) ────────────────────────────────
    private Long   schoolId;
    private String schoolName;
    private String schoolCode;
    private String legalName;
    private String currentAcademicYear;
    private String subscriptionPlan;
    private String tenantStatus;    // TRIAL | ACTIVE | SUSPENDED

    // ── Branding (null for SUPER_ADMIN) ───────────────────────────────────────
    private String logoUrl;
    private String faviconUrl;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;
    private String tagline;
}
