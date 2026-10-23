package com.sms.school.controller;

import com.sms.school.dto.request.CreateLessonPlanRequest;
import com.sms.school.dto.request.UpdateTopicProgressRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.LessonPlanResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.LessonPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teacher/lesson-plans")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'PRINCIPAL')")
@Tag(name = "Lesson Plans", description = "Teacher lesson planning and syllabus tracking")
public class LessonPlanController {

    private final LessonPlanService lessonPlanService;

    @PostMapping
    @Operation(summary = "Create a new lesson plan")
    public ResponseEntity<ApiResponse<LessonPlanResponse>> create(
            @Valid @RequestBody CreateLessonPlanRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Lesson plan created", lessonPlanService.create(schoolId, userId, request)));
    }

    @GetMapping
    @Operation(summary = "Get my lesson plans")
    public ResponseEntity<ApiResponse<List<LessonPlanResponse>>> getMyPlans(
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                lessonPlanService.getMyPlans(schoolId, userId, academicYear)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lesson plan by ID")
    public ResponseEntity<ApiResponse<LessonPlanResponse>> getById(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(lessonPlanService.getById(schoolId, id)));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get lesson plans for a section and subject")
    public ResponseEntity<ApiResponse<List<LessonPlanResponse>>> getSectionPlans(
            @PathVariable Long sectionId,
            @RequestParam Long subjectId,
            @RequestParam String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                lessonPlanService.getSectionPlans(schoolId, sectionId, subjectId, academicYear)));
    }

    @PostMapping("/{id}/topics")
    @Operation(summary = "Add a topic to a lesson plan")
    public ResponseEntity<ApiResponse<LessonPlanResponse>> addTopic(
            @PathVariable Long id,
            @Valid @RequestBody CreateLessonPlanRequest.TopicRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Topic added", lessonPlanService.addTopic(schoolId, userId, id, request)));
    }

    @PatchMapping("/{planId}/topics/{topicId}/progress")
    @Operation(summary = "Update topic completion progress")
    public ResponseEntity<ApiResponse<LessonPlanResponse>> updateProgress(
            @PathVariable Long planId,
            @PathVariable Long topicId,
            @Valid @RequestBody UpdateTopicProgressRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                "Progress updated", lessonPlanService.updateTopicProgress(schoolId, planId, topicId, request)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Approve a lesson plan (Principal/Admin only)")
    public ResponseEntity<ApiResponse<LessonPlanResponse>> approvePlan(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                "Plan approved", lessonPlanService.approvePlan(schoolId, id, userId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a lesson plan (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        lessonPlanService.deletePlan(schoolId, userId, id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted", null));
    }
}
