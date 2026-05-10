package com.sms.school.dto.request;

import com.sms.school.entity.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class MarkAttendanceRequest {

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotNull(message = "Attendance entries are required")
    private List<AttendanceEntry> entries;

    @Data
    public static class AttendanceEntry {
        @NotNull private Long studentId;
        @NotNull private AttendanceStatus status;
        private String remarks;
    }
}
