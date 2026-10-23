package com.sms.school.security;

import com.sms.school.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for reading the currently-authenticated user's context.
 *
 * Design rules:
 *  - SUPER_ADMIN: schoolId = null. isSuperAdmin() = true.
 *    SUPER_ADMIN can access any school via explicit schoolId params.
 *  - SCHOOL_USER: schoolId is always non-null. assertSchoolAccess() enforces isolation.
 *
 * Services call these helpers instead of digging into SecurityContextHolder directly.
 * The helpers are compile-time-checked and provide clear failure messages.
 */
public final class TenantContext {

    private TenantContext() {}

    // ── Principal access ───────────────────────────────────────────────────────

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    // ── User identity ──────────────────────────────────────────────────────────

    public static Long getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser().getUsername();
    }

    public static String getUserType() {
        return getCurrentUser().getUserType();
    }

    // ── Tenant identity ────────────────────────────────────────────────────────

    /**
     * The school the logged-in user belongs to.
     * Returns null for SUPER_ADMIN — callers must handle this case.
     */
    public static Long getCurrentSchoolId() {
        return getCurrentUser().getSchoolId();
    }

    public static String getCurrentSchoolCode() {
        return getCurrentUser().getSchoolCode();
    }

    public static String getCurrentSchoolName() {
        return getCurrentUser().getSchoolName();
    }

    // ── Role checks ────────────────────────────────────────────────────────────

    public static boolean isSuperAdmin() {
        return getCurrentUser().isSuperAdmin();
    }

    /**
     * Throws if caller is not a SUPER_ADMIN.
     * Use at the start of platform-level service methods.
     */
    public static void requireSuperAdmin() {
        if (!isSuperAdmin()) {
            throw new UnauthorizedException("Platform admin access required");
        }
    }

    /**
     * Throws if caller has no school context (i.e., is a SUPER_ADMIN calling
     * a school-scoped endpoint without specifying a school).
     */
    public static void requireSchoolContext() {
        if (getCurrentSchoolId() == null) {
            throw new UnauthorizedException("School context required for this operation");
        }
    }

    // ── Cross-tenant isolation guard ───────────────────────────────────────────

    /**
     * Ensures the resource being accessed belongs to the caller's school.
     *
     * SUPER_ADMIN always passes (schoolId == null → bypass).
     * SCHOOL_USER fails if the resource's school ≠ their school.
     *
     * Call this in any service that receives a schoolId from a path variable
     * rather than from TenantContext (e.g., when a controller passes schoolId
     * down to a shared service method).
     */
    public static void assertSchoolAccess(Long resourceSchoolId) {
        Long currentSchoolId = getCurrentSchoolId();
        if (currentSchoolId != null && !currentSchoolId.equals(resourceSchoolId)) {
            throw new UnauthorizedException(
                    "Access denied: resource belongs to a different school tenant");
        }
    }

    /**
     * Resolves the effective school ID for a service call.
     *
     * For SCHOOL_USER: always returns their own school ID (ignores parameter).
     * For SUPER_ADMIN: returns the explicitly passed schoolId.
     *
     * This lets super admin service methods accept an explicit schoolId,
     * while school users are automatically scoped to their own school.
     *
     * Example usage in service:
     *   Long tenantId = TenantContext.resolveSchoolId(schoolIdParam);
     */
    public static Long resolveSchoolId(Long explicitSchoolId) {
        Long own = getCurrentSchoolId();
        if (own != null) {
            // School-scoped user: always use own school, ignore explicit param
            return own;
        }
        // SUPER_ADMIN: must provide explicit school ID
        if (explicitSchoolId == null) {
            throw new UnauthorizedException("School ID required for super admin operation");
        }
        return explicitSchoolId;
    }
}
