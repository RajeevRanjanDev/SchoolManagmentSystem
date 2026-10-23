package com.sms.school.repository;

import com.sms.school.entity.Classwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClassworkRepository extends JpaRepository<Classwork, Long> {

    // Legacy (section only)
    List<Classwork> findBySectionIdAndClassworkDateBetweenAndDeletedFalse(
            Long sectionId, LocalDate from, LocalDate to);

    List<Classwork> findBySectionIdAndDeletedFalse(Long sectionId);

    // Tenant-scoped (preferred)
    List<Classwork> findBySchoolIdAndSectionIdAndDeletedFalse(Long schoolId, Long sectionId);

    List<Classwork> findBySchoolIdAndSectionIdAndClassworkDateBetweenAndDeletedFalse(
            Long schoolId, Long sectionId, LocalDate from, LocalDate to);

    List<Classwork> findBySchoolIdAndTeacherIdAndDeletedFalse(Long schoolId, Long teacherId);

    List<Classwork> findBySchoolIdAndSectionIdAndSubjectIdAndDeletedFalse(
            Long schoolId, Long sectionId, Long subjectId);
}
