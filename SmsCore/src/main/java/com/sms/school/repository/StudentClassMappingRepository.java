package com.sms.school.repository;

import com.sms.school.entity.StudentClassMapping;
import com.sms.school.entity.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentClassMappingRepository extends JpaRepository<StudentClassMapping, Long> {

    /** The single ACTIVE enrollment for a student in a given academic year */
    Optional<StudentClassMapping> findBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
            Long schoolId, Long studentId, String academicYear, EnrollmentStatus status);

    /** Full enrollment history for a student across all years */
    List<StudentClassMapping> findBySchoolIdAndStudentIdAndDeletedFalseOrderByAcademicYearDesc(
            Long schoolId, Long studentId);

    /** All ACTIVE enrollments in a section for a given year */
    List<StudentClassMapping> findBySchoolIdAndSectionIdAndAcademicYearAndStatusAndDeletedFalse(
            Long schoolId, Long sectionId, String academicYear, EnrollmentStatus status);

    /** All ACTIVE enrollments in a section (any year) — for rosters like attendance */
    @Query("""
            SELECT scm FROM StudentClassMapping scm
            WHERE scm.section.id = :sectionId
              AND scm.status = 'ACTIVE'
              AND scm.deleted = false
            """)
    List<StudentClassMapping> findActiveBySection(Long sectionId);

    /** Check if student already has an active enrollment for the year */
    boolean existsBySchoolIdAndStudentIdAndAcademicYearAndStatusAndDeletedFalse(
            Long schoolId, Long studentId, String academicYear, EnrollmentStatus status);

    /** Students enrolled in all sections of a class for a given year */
    @Query("""
            SELECT scm FROM StudentClassMapping scm
            WHERE scm.school.id          = :schoolId
              AND scm.schoolClass.id     = :classId
              AND scm.academicYear       = :academicYear
              AND scm.status             = 'ACTIVE'
              AND scm.deleted            = false
            """)
    List<StudentClassMapping> findActiveByClassAndYear(Long schoolId, Long classId, String academicYear);

    /** Batch: active enrollments for a list of student IDs (used for list views) */
    @Query("""
            SELECT scm FROM StudentClassMapping scm
            WHERE scm.school.id      = :schoolId
              AND scm.student.id    IN :studentIds
              AND scm.status         = 'ACTIVE'
              AND scm.deleted        = false
            """)
    List<StudentClassMapping> findActiveByStudentIds(
            @org.springframework.data.repository.query.Param("schoolId") Long schoolId,
            @org.springframework.data.repository.query.Param("studentIds") java.util.List<Long> studentIds);
}
