package com.sms.school.service;

import com.sms.school.dto.response.DashboardResponse;

public interface DashboardService {
    DashboardResponse getAdminDashboard(Long schoolId);
}
