package com.sms.school.dto.response.student;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/** Attendance summary + monthly breakdown + recent days for the student. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceResponse {

    private double percentage;
    private int present;
    private int absent;
    private int late;
    private int total;

    private List<Month> months;
    private List<Day> recent;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Month {
        private String label;   // e.g. "May"
        private int present;
        private int absent;
        private int total;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Day {
        private LocalDate date;
        private String status;
        private String remarks;
    }
}
