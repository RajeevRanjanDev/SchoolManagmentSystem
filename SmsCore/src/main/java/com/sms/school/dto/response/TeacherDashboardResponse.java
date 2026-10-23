package com.sms.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * One-shot payload returned when a teacher logs in and loads their dashboard.
 * Groups assignments by class → section → subjects for easy rendering.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDashboardResponse {

    private Long teacherId;
    private String teacherName;
    private String employeeCode;
    private String photoUrl;
    private String academicYear;

    /** Flat list of all assignments; the UI groups them as needed. */
    private List<TeacherAssignmentResponse> assignments;

    /** Sections where this teacher is the class teacher. */
    private List<ClassTeacherSection> classTeacherSections;

    /** Summary counts */
    private int totalSections;
    private int totalSubjects;
    private int homeworkPostedThisWeek;
    private int classworkPostedThisWeek;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassTeacherSection {
        private Long sectionId;
        private String sectionName;
        private Long classId;
        private String className;
        private int studentCount;
    }
}
