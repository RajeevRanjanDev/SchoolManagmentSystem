package com.sms.school.repository;

import com.sms.school.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {

    List<Homework> findBySectionIdAndAssignedDateBetweenAndDeletedFalse(
            Long sectionId, LocalDate from, LocalDate to);

    List<Homework> findBySectionIdAndDeletedFalse(Long sectionId);

    List<Homework> findBySchoolIdAndSectionIdAndDeletedFalse(Long schoolId, Long sectionId);
}
