package com.sms.school.security;

/**
 * Thread-local holder for the current campus scope.
 *
 * Campus-scoped users have a campus_id set in user_campus_scope.
 * Tenant-scoped (group-level) users have campusId = null → see all campuses.
 *
 * Set by JwtAuthFilter after TenantContext is populated.
 */
public final class CampusContext {

    private static final ThreadLocal<Long> CAMPUS_ID = new ThreadLocal<>();

    private CampusContext() {}

    public static void setCurrentCampusId(Long campusId) {
        CAMPUS_ID.set(campusId);
    }

    /** Returns null for tenant-scoped (group admin) users — they see all campuses. */
    public static Long getCurrentCampusId() {
        return CAMPUS_ID.get();
    }

    public static boolean isCampusScoped() {
        return CAMPUS_ID.get() != null;
    }

    public static void clear() {
        CAMPUS_ID.remove();
    }
}
