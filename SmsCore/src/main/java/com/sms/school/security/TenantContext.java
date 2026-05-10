package com.sms.school.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for reading the currently-authenticated user's context.
 * Services call these helpers instead of digging into SecurityContextHolder directly.
 */
public final class TenantContext {

    private TenantContext() {}

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    /** The school the logged-in user belongs to. Null for SUPER_ADMIN. */
    public static Long getCurrentSchoolId() {
        return getCurrentUser().getSchoolId();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    public static String getCurrentUserEmail() {
        return getCurrentUser().getUsername();
    }

    /** Throws if the resource school doesn't match the logged-in user's school. */
    public static void assertSchoolAccess(Long resourceSchoolId) {
        Long currentSchoolId = getCurrentSchoolId();
        // SUPER_ADMIN has null schoolId — they can access anything
        if (currentSchoolId != null && !currentSchoolId.equals(resourceSchoolId)) {
            throw new com.sms.school.exception.UnauthorizedException(
                    "Access denied: resource belongs to a different school");
        }
    }
}
