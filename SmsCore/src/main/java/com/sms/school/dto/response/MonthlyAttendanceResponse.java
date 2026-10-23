package com.sms.school.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Monthly attendance calendar for the Parent App.
 */
@Data
@Builder
public class MonthlyAttendanceResponse {

    private Long   studentId;
    private String month;                // "2025-06"
    private int    presentDays;
    private int    absentDays;
    private int    lateDays;
    private int    totalDays;
    private double attendancePercentage; // rounded to 1 decimal
    private List<DayRecord> records;

    @Data
    @Builder
    public static class DayRecord {
        private LocalDate date;
        private String    status;        // PRESENT, ABSENT, LATE, HALF_DAY, HOLIDAY, MEDICAL_LEAVE
        private String    remarks;
    }
}
