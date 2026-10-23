package com.sms.school.repository;

import com.sms.school.entity.LessonPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonPlanRepository extends JpaRepository<LessonPlan, Long> {

    List<LessonPlan> findBySchoolIdAndTeacherIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long teacherId, String academicYear);

    List<LessonPlan> findBySchoolIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long sectionId, Long subjectId, String academicYear);

    @Query("""
            SELECT lp FROM LessonPlan lp
            JOIN FETCH lp.teacher t
            JOIN FETCH lp.section s
            JOIN FETCH lp.subject sub
            WHERE lp.school.id = :schoolId
              AND lp.teacher.id = :teacherId
              AND lp.academicYear = :academicYear
              AND lp.deleted = false
            ORDER BY lp.startDate DESC
            """)
    List<LessonPlan> findByTeacherWithDetails(
            @org.springframework.data.repository.query.Param("schoolId") Long schoolId,
            @org.springframework.data.repository.query.Param("teacherId") Long teacherId,
            @org.springframework.data.repository.query.Param("academicYear") String academicYear);

    Optional<LessonPlan> findByIdAndSchoolIdAndDeletedFalse(Long id, Long schoolId);
}
