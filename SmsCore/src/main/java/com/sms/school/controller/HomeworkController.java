package com.sms.school.controller;

import com.sms.school.dto.request.CreateHomeworkRequest;
import com.sms.school.dto.request.ReviewSubmissionRequest;
import com.sms.school.dto.request.SubmitHomeworkRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Homework;
import com.sms.school.entity.HomeworkSubmission;
import com.sms.school.entity.School;
import com.sms.school.entity.Section;
import com.sms.school.entity.Student;
import com.sms.school.entity.Teacher;
import com.sms.school.entity.User;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.repository.HomeworkSubmissionRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/homework")
@RequiredArgsConstructor
@Tag(name = "Homework", description = "Assign and view homework")
public class HomeworkController {

    private final HomeworkRepository homeworkRepository;
    private final SchoolRepository schoolRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN')")
    @Operation(summary = "Assign homework to a section")
    public ResponseEntity<ApiResponse<Homework>> createHomework(
            @Valid @RequestBody CreateHomeworkRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Section section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section", request.getSectionId()));
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found for user " + userId));

        Homework hw = Homework.builder()
                .school(school)
                .section(section)
                .teacher(teacher)
                .subject(request.getSubject())
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedDate(request.getAssignedDate())
                .dueDate(request.getDueDate())
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Homework assigned", homeworkRepository.save(hw)));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get homework for a section (optionally filtered by date range)")
    public ResponseEntity<ApiResponse<List<Homework>>> getSectionHomework(
            @PathVariable Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<Homework> list;
        if (from != null && to != null) {
            list = homeworkRepository.findBySectionIdAndAssignedDateBetweenAndDeletedFalse(sectionId, from, to);
        } else {
            list = homeworkRepository.findBySectionIdAndDeletedFalse(sectionId);
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{homeworkId}/submit")
    @PreAuthorize("hasAnyRole('PARENT', 'STUDENT', 'SCHOOL_ADMIN')")
    @Operation(summary = "Student / parent submits homework")
    public ResponseEntity<ApiResponse<HomeworkSubmission>> submitHomework(
            @PathVariable Long homeworkId,
            @RequestParam Long studentId,
            @Valid @RequestBody SubmitHomeworkRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Homework homework = homeworkRepository.findById(homeworkId)
                .filter(h -> h.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Homework", homeworkId));

        // Upsert: one submission per student per homework
        HomeworkSubmission submission = homeworkSubmissionRepository
                .findBySchoolIdAndHomeworkIdAndStudentIdAndDeletedFalse(schoolId, homeworkId, studentId)
                .orElseGet(() -> {
                    Student s = new Student();
                    s.setId(studentId);
                    return HomeworkSubmission.builder()
                            .school(school).homework(homework).student(s).build();
                });

        submission.setSubmissionUrl(request.getSubmissionUrl());
        submission.setTextResponse(request.getTextResponse());
        submission.setSubmittedAt(java.time.LocalDateTime.now());
        boolean isLate = homework.getDueDate() != null
                && java.time.LocalDate.now().isAfter(homework.getDueDate());
        submission.setStatus(isLate ? "LATE" : "SUBMITTED");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Homework submitted", homeworkSubmissionRepository.save(submission)));
    }

    @GetMapping("/{homeworkId}/submissions")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Teacher: view all submissions for a homework")
    public ResponseEntity<ApiResponse<List<HomeworkSubmission>>> getSubmissions(
            @PathVariable Long homeworkId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                homeworkSubmissionRepository.findBySchoolIdAndHomeworkIdAndDeletedFalse(schoolId, homeworkId)));
    }

    @PatchMapping("/submissions/{submissionId}/review")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Teacher: review / grade a homework submission")
    public ResponseEntity<ApiResponse<HomeworkSubmission>> reviewSubmission(
            @PathVariable Long submissionId,
            @Valid @RequestBody ReviewSubmissionRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        HomeworkSubmission submission = homeworkSubmissionRepository.findById(submissionId)
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));

        User reviewer = new User();
        reviewer.setId(userId);
        submission.setReviewedBy(reviewer);
        submission.setReviewedAt(java.time.LocalDateTime.now());
        if (request.getStatus() != null) submission.setStatus(request.getStatus());
        if (request.getGrade() != null) submission.setGrade(request.getGrade());
        if (request.getTeacherRemarks() != null) submission.setTeacherRemarks(request.getTeacherRemarks());

        return ResponseEntity.ok(ApiResponse.success("Reviewed",
                homeworkSubmissionRepository.save(submission)));
    }
}
