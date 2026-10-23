package com.sms.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Summary statistics shown on the admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private long totalStudents;
    private long totalTeachers;
    private long totalParents;
    private long totalClasses;
    private long todayPresentCount;
    private long todayAbsentCount;
    private BigDecimal totalFeesCollectedThisMonth;
    private BigDecimal totalFeesPendingThisMonth;
    private long pendingFeeCount;
    private long booksIssued;
    private long upcomingEventsCount;
}
