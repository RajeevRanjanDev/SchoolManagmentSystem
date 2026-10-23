package com.sms.school.repository;

import com.sms.school.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findBySectionIdAndAcademicYearAndDeletedFalse(Long sectionId, String academicYear);

    List<Timetable> findByTeacherIdAndAcademicYearAndDeletedFalse(Long teacherId, String academicYear);
}
