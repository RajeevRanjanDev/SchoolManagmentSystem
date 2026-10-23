package com.sms.school.service;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;

import java.util.List;

/**
 * Teacher-facing service: own dashboard, creating academic work, marking attendance, entering marks.
 */
public interface TeacherDashboardService {

    // ── Dashboard ─────────────────────────────────────────────────────────────

    TeacherDashboardResponse getMyDashboard(Long schoolId, Long userId, String academicYear);

    List<TeacherAssignmentResponse> getMyAssignments(Long schoolId, Long userId, String academicYear);

    /** The sections the logged-in teacher is CLASS TEACHER of (the scope for their class operations). */
    List<TeacherDashboardResponse.ClassTeacherSection> getMyClassSections(Long schoolId, Long userId, String academicYear);

    /** Fuller read-only profile of a student (guardians, address, details) for the class teacher. */
    TeacherStudentCardResponse getStudentCard(Long schoolId, Long studentId);

    // ── Homework ──────────────────────────────────────────────────────────────

    /** Create homework — validates teacher owns the section+subject mapping. */
    com.sms.school.dto.response.HomeworkWithSubmissionResponse createHomework(
            Long schoolId, Long userId, com.sms.school.dto.request.CreateHomeworkRequest request);

    List<com.sms.school.dto.response.HomeworkWithSubmissionResponse> getMyHomework(
            Long schoolId, Long userId, Long sectionId, String academicYear);

    // ── Classwork ─────────────────────────────────────────────────────────────

    ClassworkResponse createClasswork(Long schoolId, Long userId, CreateClassworkRequest request);

    List<ClassworkResponse> getMyClasswork(Long schoolId, Long userId, Long sectionId, String academicYear);

    // ── Attendance ────────────────────────────────────────────────────────────

    /** Bulk mark attendance for an entire section in one call. */
    void markAttendance(Long schoolId, Long userId, BulkAttendanceRequest request);

    // ── Marks ─────────────────────────────────────────────────────────────────

    /** Enter / update marks for all students in an exam. */
    void enterMarks(Long schoolId, Long userId, BulkMarksRequest request);

    // ── Announcements ─────────────────────────────────────────────────────────

    ClassAnnouncementResponse createAnnouncement(Long schoolId, Long userId,
                                                  CreateClassAnnouncementRequest request);

    List<ClassAnnouncementResponse> getMyAnnouncements(Long schoolId, Long userId);
}
