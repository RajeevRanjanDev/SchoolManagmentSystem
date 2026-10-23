package com.sms.school.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class BulkResultRequest {

    private List<Entry> results;

    @Data
    public static class Entry {
        private Long studentId;
        private Double marksObtained;
        private String grade;
    }
}
