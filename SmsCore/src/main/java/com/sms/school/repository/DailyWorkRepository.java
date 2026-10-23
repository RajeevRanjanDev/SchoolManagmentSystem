package com.sms.school.repository;

import com.sms.school.entity.DailyWork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyWorkRepository extends JpaRepository<DailyWork, Long> {

    List<DailyWork> findBySchoolIdAndSectionIdAndWorkDateAndDeletedFalse(
            Long schoolId, Long sectionId, LocalDate workDate);

    Optional<DailyWork> findBySchoolIdAndSectionIdAndWorkDateAndTypeAndDeletedFalse(
            Long schoolId, Long sectionId, LocalDate workDate, String type);

    List<DailyWork> findBySchoolIdAndSectionIdAndDeletedFalseOrderByWorkDateDesc(
            Long schoolId, Long sectionId);
}
