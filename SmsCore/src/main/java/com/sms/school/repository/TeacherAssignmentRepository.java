package com.sms.school.repository;

import com.sms.school.entity.TeacherAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherAssignmentRepository extends JpaRepository<TeacherAssignment, Long> {

    // ── Teacher's own assignments (used by teacher dashboard) ──────────────────

    List<TeacherAssignment> findBySchoolIdAndTeacherIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long teacherId, String academicYear);

    List<TeacherAssignment> findBySchoolIdAndTeacherIdAndDeletedFalse(
            Long schoolId, Long teacherId);

    // ── Section's full assignment list (used by parent app) ───────────────────

    List<TeacherAssignment> findBySchoolIdAndSectionIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long sectionId, String academicYear);

    // ── Class-teacher lookup (one per section per year) ────────────────────────

    Optional<TeacherAssignment> findBySchoolIdAndSectionIdAndAcademicYearAndClassTeacherTrueAndDeletedFalse(
            Long schoolId, Long sectionId, String academicYear);

    /** All class-teacher assignments in a school (for notification targeting). */
    List<TeacherAssignment> findBySchoolIdAndClassTeacherTrueAndDeletedFalse(Long schoolId);

    /** Class-teacher assignments for a specific class. */
    List<TeacherAssignment> findBySchoolIdAndSchoolClassIdAndClassTeacherTrueAndDeletedFalse(
            Long schoolId, Long classId);

    // ── Duplicate guard ────────────────────────────────────────────────────────

    boolean existsBySchoolIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long sectionId, Long subjectId, String academicYear);

    // ── Validate that a specific teacher owns this section+subject assignment ──

    Optional<TeacherAssignment> findBySchoolIdAndTeacherIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long teacherId, Long sectionId, Long subjectId, String academicYear);

    boolean existsBySchoolIdAndTeacherIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long teacherId, Long sectionId, Long subjectId, String academicYear);

    // ── Admin: all assignments for a section ───────────────────────────────────

    @Query("""
            SELECT ta FROM TeacherAssignment ta
            JOIN FETCH ta.teacher t
            JOIN FETCH ta.subject s
            WHERE ta.school.id  = :schoolId
              AND ta.section.id = :sectionId
              AND ta.academicYear = :year
              AND ta.deleted = false
            ORDER BY s.subjectName
            """)
    List<TeacherAssignment> findBySectionWithDetails(Long schoolId, Long sectionId, String year);

    // ── Admin: all assignments for a teacher ───────────────────────────────────

    @Query("""
            SELECT ta FROM TeacherAssignment ta
            JOIN FETCH ta.schoolClass c
            JOIN FETCH ta.section sec
            JOIN FETCH ta.subject s
            WHERE ta.school.id    = :schoolId
              AND ta.teacher.id   = :teacherId
              AND (:year IS NULL OR :year = '' OR ta.academicYear = :year)
              AND ta.deleted      = false
            ORDER BY c.name, sec.name, s.subjectName
            """)
    List<TeacherAssignment> findByTeacherWithDetails(Long schoolId, Long teacherId, String year);

    // ── All assignments for a school (batch for list views) ───────────────────

    @Query("""
            SELECT ta FROM TeacherAssignment ta
            JOIN FETCH ta.schoolClass c
            JOIN FETCH ta.section sec
            JOIN FETCH ta.subject s
            WHERE ta.school.id = :schoolId
              AND ta.deleted   = false
            ORDER BY ta.teacher.id, c.name, sec.name
            """)
    List<TeacherAssignment> findAllBySchoolWithDetails(Long schoolId);
}
