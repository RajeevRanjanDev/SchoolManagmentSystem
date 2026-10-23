package com.sms.school.repository;

import com.sms.school.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {

    List<SchoolClass> findBySchoolIdAndAcademicYearAndDeletedFalse(Long schoolId, String academicYear);

    List<SchoolClass> findBySchoolIdAndDeletedFalse(Long schoolId);

    long countBySchoolIdAndDeletedFalse(Long schoolId);
}
