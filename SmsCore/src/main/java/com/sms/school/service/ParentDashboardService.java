package com.sms.school.service;

import com.sms.school.dto.request.SubmitHomeworkRequest;
import com.sms.school.dto.response.*;

import java.util.List;

public interface ParentDashboardService {

    List<ChildSummaryResponse> getMyChildren(Long schoolId, Long userId, String academicYear);

    MonthlyAttendanceResponse getAttendance(Long schoolId, Long userId, Long studentId, String month);

    List<HomeworkWithSubmissionResponse> getHomework(Long schoolId, Long userId, Long studentId, String academicYear);

    HomeworkWithSubmissionResponse submitHomework(Long schoolId, Long userId, Long studentId,
                                                  Long homeworkId, SubmitHomeworkRequest request);

    List<ResultResponse> getResults(Long schoolId, Long userId, Long studentId);

    List<FeeResponse> getFees(Long schoolId, Long userId, Long studentId, String academicYear);

    // ── Teacher / subject data for a child ────────────────────────────────────

    /** Returns subjects + teacher names for the child's current section. */
    List<TeacherAssignmentResponse> getChildTeachers(Long schoolId, Long userId, Long studentId, String academicYear);

    /** Returns classwork entries for the child's current section. */
    List<ClassworkResponse> getClasswork(Long schoolId, Long userId, Long studentId, String academicYear);

    /** Returns class announcements for the child's current section. */
    List<ClassAnnouncementResponse> getAnnouncements(Long schoolId, Long userId, Long studentId);
}
