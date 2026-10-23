package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Teacher marks attendance for an entire section in one request.
 */
@Data
public class BulkAttendanceRequest {

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotNull(message = "Date is required")
    private LocalDate attendanceDate;

    @NotEmpty(message = "At least one student record is required")
    private List<StudentAttendanceEntry> entries;

    @Data
    public static class StudentAttendanceEntry {
        @NotNull
        private Long studentId;

        /** PRESENT | ABSENT | LATE | HALF_DAY | LEAVE */
        @NotBlank
        private String status;

        private String remarks;
    }
}
