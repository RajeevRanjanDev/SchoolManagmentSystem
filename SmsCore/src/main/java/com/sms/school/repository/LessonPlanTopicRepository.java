package com.sms.school.repository;

import com.sms.school.entity.LessonPlanTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonPlanTopicRepository extends JpaRepository<LessonPlanTopic, Long> {

    List<LessonPlanTopic> findByLessonPlanIdAndDeletedFalseOrderBySequenceNoAsc(Long lessonPlanId);

    Optional<LessonPlanTopic> findByIdAndLessonPlanIdAndDeletedFalse(Long id, Long lessonPlanId);

    long countByLessonPlanIdAndCompletionStatusAndDeletedFalse(Long lessonPlanId, String completionStatus);
}
