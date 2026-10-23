package com.sms.school.dto.response.student;

import lombok.*;

import java.math.BigDecimal;

/** Snapshot for the student home screen. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardResponse {
    private String studentName;
    private String schoolName;
    private String className;
    private String sectionName;
    private double attendanceRate;       // 0-100
    private BigDecimal outstandingFee;
    private int todayAssignments;
    private int todayUpdates;
}
