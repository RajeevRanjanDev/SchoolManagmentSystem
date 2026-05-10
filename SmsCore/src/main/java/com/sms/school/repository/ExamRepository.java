package com.sms.school.repository;

import com.sms.school.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findBySectionIdAndAcademicYearAndDeletedFalse(Long sectionId, String academicYear);
}
