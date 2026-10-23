package com.sms.school.service;

import com.sms.school.dto.request.MarkAttendanceRequest;
import com.sms.school.dto.response.AttendanceResponse;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    List<AttendanceResponse> markAttendance(Long schoolId, Long teacherId, MarkAttendanceRequest request);

    List<AttendanceResponse> getSectionAttendance(Long schoolId, Long sectionId, LocalDate date);

    List<AttendanceResponse> getStudentAttendance(Long schoolId, Long studentId, LocalDate from, LocalDate to);

    /** Returns the attendance % (0–100) for a student in the given date range */
    double getAttendancePercentage(Long schoolId, Long studentId, LocalDate from, LocalDate to);
}
