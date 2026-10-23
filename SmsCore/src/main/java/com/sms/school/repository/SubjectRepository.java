package com.sms.school.repository;

import com.sms.school.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findBySchoolIdAndDeletedFalse(Long schoolId);

    List<Subject> findBySchoolIdAndStatusAndDeletedFalse(Long schoolId, String status);

    Optional<Subject> findBySchoolIdAndSubjectCodeAndDeletedFalse(Long schoolId, String subjectCode);

    boolean existsBySchoolIdAndSubjectNameAndDeletedFalse(Long schoolId, String subjectName);

    Optional<Subject> findBySchoolIdAndSubjectNameAndDeletedFalse(Long schoolId, String subjectName);
}
