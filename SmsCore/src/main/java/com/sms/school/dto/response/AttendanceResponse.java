package com.sms.school.dto.response;

import com.sms.school.entity.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private Long sectionId;
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private String remarks;
}
