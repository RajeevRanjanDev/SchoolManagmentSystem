package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Exam;
import com.sms.school.entity.Result;
import com.sms.school.entity.School;
import com.sms.school.entity.Section;
import com.sms.school.entity.Student;
import com.sms.school.entity.Teacher;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@Tag(name = "Exams & Results", description = "Exam scheduling and result entry")
public class ExamController {

    private final ExamRepository examRepository;
    private final ResultRepository resultRepository;
    private final SchoolRepository schoolRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Schedule a new exam")
    public ResponseEntity<ApiResponse<Exam>> scheduleExam(
            @RequestParam Long sectionId,
            @RequestParam String examName,
            @RequestParam String subject,
            @RequestParam LocalDate examDate,
            @RequestParam Double totalMarks,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

        Exam exam = Exam.builder()
                .school(school).section(section)
                .examName(examName).subject(subject)
                .examDate(examDate).totalMarks(totalMarks)
                .academicYear(academicYear).build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Exam scheduled", examRepository.save(exam)));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get exams for a section in an academic year")
    public ResponseEntity<ApiResponse<List<Exam>>> getSectionExams(
            @PathVariable Long sectionId,
            @RequestParam String academicYear) {

        return ResponseEntity.ok(ApiResponse.success(
                examRepository.findBySectionIdAndAcademicYearAndDeletedFalse(sectionId, academicYear)));
    }

    @PostMapping("/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN')")
    @Operation(summary = "Upload exam result for a student")
    public ResponseEntity<ApiResponse<Result>> uploadResult(
            @RequestParam Long examId,
            @RequestParam Long studentId,
            @RequestParam Double marksObtained,
            @RequestParam(required = false) String grade) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Teacher teacher = teacherRepository.findByUserId(userId).orElse(null);

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        Result result = Result.builder()
                .school(school).exam(exam).student(student)
                .marksObtained(marksObtained).grade(grade)
                .enteredByTeacher(teacher).build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Result uploaded", resultRepository.save(result)));
    }

    @GetMapping("/results/student/{studentId}")
    @Operation(summary = "Get all results for a student")
    public ResponseEntity<ApiResponse<List<Result>>> getStudentResults(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(ApiResponse.success(
                resultRepository.findByStudentIdAndDeletedFalse(studentId)));
    }

    @PatchMapping("/results/{resultId}/publish")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Publish a result (make it visible to parents)")
    public ResponseEntity<ApiResponse<Result>> publishResult(@PathVariable Long resultId) {
        Result result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Result", resultId));
        result.setPublished(true);
        return ResponseEntity.ok(ApiResponse.success("Result published", resultRepository.save(result)));
    }
}
