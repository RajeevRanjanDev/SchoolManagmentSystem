package com.sms.school.security;

import com.sms.school.exception.UnauthorizedException;
import com.sms.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Checks whether a school (tenant) is allowed to receive requests.
 *
 * Called inside JwtAuthenticationFilter for every school-scoped request.
 * Uses a simple in-process cache to avoid a DB hit on every request.
 *
 * Cache TTL: 5 minutes — tolerable lag between suspension and enforcement.
 */
@Component
@RequiredArgsConstructor
public class TenantStatusChecker {

    private final SchoolRepository schoolRepository;

    // Simple in-memory cache: schoolId → allowed (true/false), populated lazily
    private final java.util.concurrent.ConcurrentHashMap<Long, CacheEntry> cache
            = new java.util.concurrent.ConcurrentHashMap<>();

    private static final long CACHE_TTL_MS = 5 * 60 * 1000L; // 5 minutes

    /**
     * Throws UnauthorizedException if the school is SUSPENDED/TERMINATED, OR its
     * subscription has expired. So once a subscription ends, every request (not
     * just new logins) is rejected and the account is effectively inactive.
     * TRIAL and ACTIVE with a valid (or no) expiry are allowed.
     */
    public void assertSchoolActive(Long schoolId) {
        CacheEntry entry = cache.get(schoolId);
        long now = System.currentTimeMillis();

        if (entry == null || now - entry.cachedAt > CACHE_TTL_MS) {
            boolean allowed = schoolRepository.findById(schoolId)
                    .map(s -> isAllowedStatus(s.getStatus())
                            && (s.getSubscriptionExpiry() == null
                                || !s.getSubscriptionExpiry().isBefore(java.time.LocalDate.now())))
                    .orElse(false);
            entry = new CacheEntry(allowed, now);
            cache.put(schoolId, entry);
        }

        if (!entry.allowed) {
            throw new UnauthorizedException(
                    "Your school account is inactive — it is suspended or its subscription has expired. "
                            + "Please contact the platform administrator.");
        }
    }

    /** Call this after a super admin changes a school's status, to invalidate cache. */
    public void evict(Long schoolId) {
        cache.remove(schoolId);
    }

    private boolean isAllowedStatus(String status) {
        return "ACTIVE".equals(status) || "TRIAL".equals(status);
    }

    private record CacheEntry(boolean allowed, long cachedAt) {}
}
