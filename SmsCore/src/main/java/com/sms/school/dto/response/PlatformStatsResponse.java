package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Platform-wide statistics for the Super Admin dashboard.
 */
@Data
@Builder
public class PlatformStatsResponse {

    // Tenant counts by status
    private long totalTenants;
    private long activeTenants;
    private long trialTenants;
    private long suspendedTenants;
    private long terminatedTenants;

    // Usage across platform
    private long totalStudents;
    private long totalTeachers;
    private long totalParents;
    private long totalUsers;

    // Revenue (rough, plan-based)
    private long monthlyRecurringRevenue;   // sum of active tenant monthly prices

    // Recent activity
    private long newTenantsThisMonth;
    private long newStudentsThisMonth;

    // Schools in a red/alert state (usage ≥ 90% or subscription expiring/expired)
    private long alertSchools;
}
