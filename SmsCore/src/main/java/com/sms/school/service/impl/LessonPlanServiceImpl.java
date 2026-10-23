package com.sms.school.service.impl;

import com.sms.school.dto.request.CreateLessonPlanRequest;
import com.sms.school.dto.request.UpdateTopicProgressRequest;
import com.sms.school.dto.response.LessonPlanResponse;
import com.sms.school.entity.*;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.service.LessonPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonPlanServiceImpl implements LessonPlanService {

    private final LessonPlanRepository lessonPlanRepo;
    private final LessonPlanTopicRepository topicRepo;
    private final TeacherRepository teacherRepo;
    private final SectionRepository sectionRepo;
    private final SubjectRepository subjectRepo;
    private final SchoolRepository schoolRepo;

    // ── helpers ───────────────────────────────────────────────────────────────

    private Teacher requireTeacher(Long schoolId, Long userId) {
        return teacherRepo.findActiveBySchoolAndUser(schoolId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found for this user"));
    }

    private LessonPlan requirePlan(Long schoolId, Long planId) {
        return lessonPlanRepo.findByIdAndSchoolIdAndDeletedFalse(planId, schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("LessonPlan", planId));
    }

    private LessonPlanResponse toResponse(LessonPlan lp) {
        List<LessonPlanTopic> topics = topicRepo
                .findByLessonPlanIdAndDeletedFalseOrderBySequenceNoAsc(lp.getId());
        long completed = topics.stream().filter(t -> "COMPLETED".equals(t.getCompletionStatus())).count();
        long delayed   = topics.stream().filter(t -> "DELAYED".equals(t.getCompletionStatus())).count();
        long pending   = topics.stream().filter(t -> "PENDING".equals(t.getCompletionStatus())).count();
        double pct     = topics.isEmpty() ? 0 : (completed * 100.0 / topics.size());
        User u = lp.getTeacher().getUser();

        return LessonPlanResponse.builder()
                .id(lp.getId())
                .schoolId(lp.getSchool().getId())
                .teacherId(lp.getTeacher().getId())
                .teacherName(u != null ? u.getFirstName() + " " + u.getLastName() : null)
                .sectionId(lp.getSection().getId())
                .sectionName(lp.getSection().getName())
                .className(lp.getSection().getSchoolClass() != null ? lp.getSection().getSchoolClass().getName() : null)
                .subjectId(lp.getSubject().getId())
                .subjectName(lp.getSubject().getSubjectName())
                .academicYear(lp.getAcademicYear())
                .planType(lp.getPlanType())
                .planName(lp.getPlanName())
                .startDate(lp.getStartDate())
                .endDate(lp.getEndDate())
                .status(lp.getStatus())
                .totalTopics(topics.size())
                .completedTopics((int) completed)
                .pendingTopics((int) pending)
                .delayedTopics((int) delayed)
                .completionPercent(Math.round(pct * 10) / 10.0)
                .topics(topics.stream().map(t -> LessonPlanResponse.TopicSummary.builder()
                        .id(t.getId()).chapterName(t.getChapterName()).topicName(t.getTopicName())
                        .learningOutcomes(t.getLearningOutcomes()).plannedDate(t.getPlannedDate())
                        .actualDate(t.getActualDate()).periodsRequired(t.getPeriodsRequired())
                        .periodsCompleted(t.getPeriodsCompleted()).completionStatus(t.getCompletionStatus())
                        .sequenceNo(t.getSequenceNo()).build()).collect(Collectors.toList()))
                .createdAt(lp.getCreatedAt())
                .build();
    }

    // ── operations ────────────────────────────────────────────────────────────

    @Override @Transactional
    public LessonPlanResponse create(Long schoolId, Long userId, CreateLessonPlanRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);
        Section section = sectionRepo.findById(req.getSectionId())
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));
        Subject subject = subjectRepo.findById(req.getSubjectId())
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Subject", req.getSubjectId()));

        LessonPlan plan = LessonPlan.builder()
                .school(teacher.getSchool()).teacher(teacher).section(section).subject(subject)
                .academicYear(req.getAcademicYear()).planType(req.getPlanType())
                .planName(req.getPlanName()).startDate(req.getStartDate()).endDate(req.getEndDate())
                .status("DRAFT").build();
        plan = lessonPlanRepo.save(plan);

        if (req.getTopics() != null) {
            final LessonPlan savedPlan = plan;
            List<LessonPlanTopic> topics = req.getTopics().stream().map(t ->
                    LessonPlanTopic.builder().lessonPlan(savedPlan)
                            .chapterName(t.getChapterName()).topicName(t.getTopicName())
                            .learningOutcomes(t.getLearningOutcomes()).plannedDate(t.getPlannedDate())
                            .periodsRequired(t.getPeriodsRequired() > 0 ? t.getPeriodsRequired() : 1)
                            .sequenceNo(t.getSequenceNo()).completionStatus("PENDING").build()
            ).collect(Collectors.toList());
            topicRepo.saveAll(topics);
        }
        return toResponse(lessonPlanRepo.findByIdAndSchoolIdAndDeletedFalse(plan.getId(), schoolId).orElseThrow());
    }

    @Override @Transactional(readOnly = true)
    public LessonPlanResponse getById(Long schoolId, Long id) {
        return toResponse(requirePlan(schoolId, id));
    }

    @Override @Transactional(readOnly = true)
    public List<LessonPlanResponse> getMyPlans(Long schoolId, Long userId, String academicYear) {
        Teacher teacher = requireTeacher(schoolId, userId);
        return lessonPlanRepo.findByTeacherWithDetails(schoolId, teacher.getId(), academicYear)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional(readOnly = true)
    public List<LessonPlanResponse> getSectionPlans(Long schoolId, Long sectionId, Long subjectId, String academicYear) {
        return lessonPlanRepo.findBySchoolIdAndSectionIdAndSubjectIdAndAcademicYearAndDeletedFalse(
                schoolId, sectionId, subjectId, academicYear)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override @Transactional
    public LessonPlanResponse addTopic(Long schoolId, Long userId, Long planId,
                                        CreateLessonPlanRequest.TopicRequest req) {
        Teacher teacher = requireTeacher(schoolId, userId);
        LessonPlan plan = requirePlan(schoolId, planId);
        if (!plan.getTeacher().getId().equals(teacher.getId()))
            throw new BusinessException("You do not own this lesson plan");

        long nextSeq = topicRepo.findByLessonPlanIdAndDeletedFalseOrderBySequenceNoAsc(planId).size();
        LessonPlanTopic topic = LessonPlanTopic.builder().lessonPlan(plan)
                .chapterName(req.getChapterName()).topicName(req.getTopicName())
                .learningOutcomes(req.getLearningOutcomes()).plannedDate(req.getPlannedDate())
                .periodsRequired(req.getPeriodsRequired() > 0 ? req.getPeriodsRequired() : 1)
                .sequenceNo(req.getSequenceNo() > 0 ? req.getSequenceNo() : (int) nextSeq)
                .completionStatus("PENDING").build();
        topicRepo.save(topic);
        return toResponse(plan);
    }

    @Override @Transactional
    public LessonPlanResponse updateTopicProgress(Long schoolId, Long planId, Long topicId,
                                                   UpdateTopicProgressRequest req) {
        LessonPlan plan = requirePlan(schoolId, planId);
        LessonPlanTopic topic = topicRepo.findByIdAndLessonPlanIdAndDeletedFalse(topicId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic", topicId));
        if (req.getActualDate() != null) topic.setActualDate(req.getActualDate());
        if (req.getPeriodsCompleted() > 0) topic.setPeriodsCompleted(req.getPeriodsCompleted());
        if (req.getCompletionStatus() != null) topic.setCompletionStatus(req.getCompletionStatus());
        topicRepo.save(topic);

        // Auto-update plan status
        List<LessonPlanTopic> all = topicRepo.findByLessonPlanIdAndDeletedFalseOrderBySequenceNoAsc(planId);
        boolean allDone = !all.isEmpty() && all.stream().allMatch(t -> "COMPLETED".equals(t.getCompletionStatus()));
        boolean anyInProgress = all.stream().anyMatch(t -> "IN_PROGRESS".equals(t.getCompletionStatus()) || "COMPLETED".equals(t.getCompletionStatus()));
        if (allDone) plan.setStatus("COMPLETED");
        else if (anyInProgress) plan.setStatus("IN_PROGRESS");
        lessonPlanRepo.save(plan);
        return toResponse(plan);
    }

    @Override @Transactional
    public LessonPlanResponse approvePlan(Long schoolId, Long planId, Long approvedBy) {
        LessonPlan plan = requirePlan(schoolId, planId);
        plan.setStatus("APPROVED");
        plan.setApprovedBy(approvedBy);
        plan.setApprovedAt(LocalDateTime.now());
        return toResponse(lessonPlanRepo.save(plan));
    }

    @Override @Transactional
    public void deletePlan(Long schoolId, Long userId, Long planId) {
        Teacher teacher = requireTeacher(schoolId, userId);
        LessonPlan plan = requirePlan(schoolId, planId);
        if (!plan.getTeacher().getId().equals(teacher.getId()))
            throw new BusinessException("You do not own this lesson plan");
        plan.setDeleted(true);
        lessonPlanRepo.save(plan);
    }
}
