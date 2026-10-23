package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.ExamResponse;
import com.sms.school.dto.response.ExamResultResponse;
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
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Schedule a new exam")
    public ResponseEntity<ApiResponse<ExamResponse>> scheduleExam(
            @RequestParam Long sectionId,
            @RequestParam String examName,
            @RequestParam(required = false) String subject,
            @RequestParam LocalDate examDate,
            @RequestParam(required = false) Double totalMarks,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

        Exam exam = Exam.builder()
                .school(school).section(section)
                .examName(examName)
                .subject(subject != null && !subject.isBlank() ? subject : "General")
                .examDate(examDate)
                .totalMarks(totalMarks != null ? totalMarks : 100.0)
                .academicYear(academicYear).build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Exam scheduled", toExamResponse(examRepository.save(exam))));
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Delete an exam and all its results")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long examId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Exam exam = examRepository.findById(examId)
                .filter(e -> e.getSchool().getId().equals(schoolId) && !e.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        resultRepository.findByExamIdAndDeletedFalse(examId).forEach(r -> { r.setDeleted(true); resultRepository.save(r); });
        exam.setDeleted(true);
        examRepository.save(exam);
        return ResponseEntity.ok(ApiResponse.success("Exam and its results deleted", null));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get exams for a section in an academic year")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getSectionExams(
            @PathVariable Long sectionId,
            @RequestParam String academicYear) {

        return ResponseEntity.ok(ApiResponse.success(
                examRepository.findBySectionIdAndAcademicYearAndDeletedFalse(sectionId, academicYear)
                        .stream().map(this::toExamResponse).toList()));
    }

    @PostMapping("/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN')")
    @Operation(summary = "Upload exam result for a student")
    public ResponseEntity<ApiResponse<ExamResultResponse>> uploadResult(
            @RequestParam Long examId,
            @RequestParam Long studentId,
            @RequestParam Double marksObtained,
            @RequestParam(required = false) String grade) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Teacher teacher = teacherRepository.findByUserId(userId).orElse(null);

        Result result = upsertResult(school, examId, studentId, marksObtained, grade, teacher);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Result uploaded", toResultResponse(result)));
    }

    @PostMapping("/{examId}/results/bulk")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Upload/update results for many students of an exam at once")
    public ResponseEntity<ApiResponse<Integer>> uploadResultsBulk(
            @PathVariable Long examId,
            @RequestBody com.sms.school.dto.request.BulkResultRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Teacher teacher = teacherRepository.findByUserId(userId).orElse(null);

        int saved = 0;
        if (request.getResults() != null) {
            for (var entry : request.getResults()) {
                if (entry.getStudentId() == null || entry.getMarksObtained() == null) continue;
                upsertResult(school, examId, entry.getStudentId(), entry.getMarksObtained(), entry.getGrade(), teacher);
                saved++;
            }
        }
        return ResponseEntity.ok(ApiResponse.success(saved + " result(s) saved", saved));
    }

    /** Create or update the single result for an exam+student. */
    private Result upsertResult(School school, Long examId, Long studentId,
                                Double marksObtained, String grade, Teacher teacher) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        Result result = resultRepository.findByExamIdAndStudentIdAndDeletedFalse(examId, studentId)
                .orElseGet(() -> {
                    Student student = studentRepository.findById(studentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
                    return Result.builder().school(school).exam(exam).student(student).build();
                });
        result.setMarksObtained(marksObtained);
        result.setGrade(grade);
        result.setEnteredByTeacher(teacher);
        return resultRepository.save(result);
    }

    @GetMapping("/results/student/{studentId}")
    @Operation(summary = "Get all results for a student")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getStudentResults(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(ApiResponse.success(
                resultRepository.findByStudentIdAndDeletedFalse(studentId)
                        .stream().map(this::toResultResponse).toList()));
    }

    @PatchMapping("/results/{resultId}/publish")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Publish a result (make it visible to students/parents)")
    public ResponseEntity<ApiResponse<ExamResultResponse>> publishResult(@PathVariable Long resultId) {
        Result result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Result", resultId));
        result.setPublished(true);
        return ResponseEntity.ok(ApiResponse.success("Result published", toResultResponse(resultRepository.save(result))));
    }

    @PatchMapping("/{examId}/results/publish-all")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Publish all results of an exam at once (make them visible to students/parents)")
    public ResponseEntity<ApiResponse<Integer>> publishAllResults(@PathVariable Long examId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        // Scope the exam to the caller's school before touching any results.
        examRepository.findById(examId)
                .filter(e -> e.getSchool().getId().equals(schoolId) && !e.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        int count = 0;
        for (Result r : resultRepository.findByExamIdAndDeletedFalse(examId)) {
            if (!r.isPublished()) { r.setPublished(true); resultRepository.save(r); count++; }
        }
        return ResponseEntity.ok(ApiResponse.success(count + " result(s) published", count));
    }

    @GetMapping("/{examId}/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get all results for an exam")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getExamResults(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.success(
                resultRepository.findByExamIdAndDeletedFalse(examId)
                        .stream().map(this::toResultResponse).toList()));
    }

    @GetMapping("/section/{sectionId}/results")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get all results for a section in an academic year")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getSectionResults(
            @PathVariable Long sectionId,
            @RequestParam String academicYear) {

        List<Exam> exams = examRepository.findBySectionIdAndAcademicYearAndDeletedFalse(sectionId, academicYear);
        List<ExamResultResponse> results = exams.stream()
                .flatMap(e -> resultRepository.findByExamIdAndDeletedFalse(e.getId()).stream())
                .map(this::toResultResponse)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // ── Mappers ─────────────────────────────────────────────────────────────────

    private ExamResponse toExamResponse(Exam e) {
        return ExamResponse.builder()
                .id(e.getId())
                .sectionId(e.getSection() != null ? e.getSection().getId() : null)
                .sectionName(e.getSection() != null ? e.getSection().getName() : null)
                .className(e.getSection() != null && e.getSection().getSchoolClass() != null
                        ? e.getSection().getSchoolClass().getName() : null)
                .examName(e.getExamName())
                .subject(e.getSubject())
                .examDate(e.getExamDate())
                .totalMarks(e.getTotalMarks())
                .academicYear(e.getAcademicYear())
                .build();
    }

    private ExamResultResponse toResultResponse(Result r) {
        return ExamResultResponse.builder()
                .id(r.getId())
                .examId(r.getExam() != null ? r.getExam().getId() : null)
                .examName(r.getExam() != null ? r.getExam().getExamName() : null)
                .totalMarks(r.getExam() != null ? r.getExam().getTotalMarks() : null)
                .studentId(r.getStudent() != null ? r.getStudent().getId() : null)
                .studentName(r.getStudent() != null
                        ? (r.getStudent().getFirstName() + " " + r.getStudent().getLastName()).trim() : null)
                .marksObtained(r.getMarksObtained())
                .grade(r.getGrade())
                .published(r.isPublished())
                .build();
    }
}
