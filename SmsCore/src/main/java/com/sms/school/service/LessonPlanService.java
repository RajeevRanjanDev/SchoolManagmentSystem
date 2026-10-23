package com.sms.school.service;

import com.sms.school.dto.request.CreateLessonPlanRequest;
import com.sms.school.dto.request.UpdateTopicProgressRequest;
import com.sms.school.dto.response.LessonPlanResponse;

import java.util.List;

public interface LessonPlanService {

    LessonPlanResponse create(Long schoolId, Long userId, CreateLessonPlanRequest request);

    LessonPlanResponse getById(Long schoolId, Long id);

    List<LessonPlanResponse> getMyPlans(Long schoolId, Long userId, String academicYear);

    List<LessonPlanResponse> getSectionPlans(Long schoolId, Long sectionId, Long subjectId, String academicYear);

    LessonPlanResponse addTopic(Long schoolId, Long userId, Long planId,
                                CreateLessonPlanRequest.TopicRequest topicReq);

    LessonPlanResponse updateTopicProgress(Long schoolId, Long planId, Long topicId,
                                           UpdateTopicProgressRequest req);

    LessonPlanResponse approvePlan(Long schoolId, Long planId, Long approvedBy);

    void deletePlan(Long schoolId, Long userId, Long planId);
}
