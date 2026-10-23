package com.sms.school.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Teacher enters marks for all students in a section for a given exam.
 */
@Data
public class BulkMarksRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotEmpty(message = "At least one result entry is required")
    private List<StudentMarksEntry> entries;

    @Data
    public static class StudentMarksEntry {
        @NotNull
        private Long studentId;

        @NotNull
        private Double marksObtained;

        private String grade;
        private String remarks;
    }
}
