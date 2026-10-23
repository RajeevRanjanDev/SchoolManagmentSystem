package com.sms.school.service;

import com.sms.school.dto.request.*;
import com.sms.school.dto.response.*;

import java.util.List;

/**
 * Admin-facing service: CRUD for teachers, subjects, and teacher assignments.
 */
public interface TeacherManagementService {

    // ── Teachers ──────────────────────────────────────────────────────────────

    TeacherResponse createTeacher(Long schoolId, CreateTeacherRequest request);

    TeacherResponse updateTeacher(Long schoolId, Long teacherId, CreateTeacherRequest request);

    TeacherResponse getTeacher(Long schoolId, Long teacherId);

    List<TeacherResponse> getAllTeachers(Long schoolId);

    void deleteTeacher(Long schoolId, Long teacherId);

    TeacherResponse updateTeacherStatus(Long schoolId, Long teacherId, String status);

    /** Generate a temp password for the employee's login and email it. Returns the email it was sent to. */
    String resetTeacherPassword(Long schoolId, Long teacherId);

    // ── Subjects ──────────────────────────────────────────────────────────────

    SubjectResponse createSubject(Long schoolId, CreateSubjectRequest request);

    List<SubjectResponse> getAllSubjects(Long schoolId);

    SubjectResponse updateSubject(Long schoolId, Long subjectId, CreateSubjectRequest request);

    void deleteSubject(Long schoolId, Long subjectId);

    // ── Teacher Assignments ───────────────────────────────────────────────────

    TeacherAssignmentResponse assignTeacher(Long schoolId, Long teacherId, AssignTeacherRequest request);

    List<TeacherAssignmentResponse> getTeacherAssignments(Long schoolId, Long teacherId, String academicYear);

    List<TeacherAssignmentResponse> getSectionAssignments(Long schoolId, Long sectionId, String academicYear);

    void removeAssignment(Long schoolId, Long assignmentId);

    void setClassTeacher(Long schoolId, Long assignmentId, boolean isClassTeacher);
}
