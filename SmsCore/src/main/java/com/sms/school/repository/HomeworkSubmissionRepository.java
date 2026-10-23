package com.sms.school.repository;

import com.sms.school.entity.HomeworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {

    Optional<HomeworkSubmission> findBySchoolIdAndHomeworkIdAndStudentIdAndDeletedFalse(
            Long schoolId, Long homeworkId, Long studentId);

    List<HomeworkSubmission> findBySchoolIdAndStudentIdAndDeletedFalse(Long schoolId, Long studentId);

    List<HomeworkSubmission> findBySchoolIdAndHomeworkIdAndDeletedFalse(Long schoolId, Long homeworkId);
}
