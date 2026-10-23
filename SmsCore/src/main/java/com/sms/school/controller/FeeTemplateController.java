package com.sms.school.controller;

import com.sms.school.dto.request.ApplyFeeTemplateRequest;
import com.sms.school.dto.request.CreateFeeTemplateRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.FeeTemplateResponse;
import com.sms.school.entity.*;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.exception.UnauthorizedException;
import com.sms.school.repository.*;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Admin-facing CRUD for reusable fee templates, plus "assign to class" which
 * generates fee records for every enrolled student in the chosen class.
 *
 * Base: /api/v1/admin/fee-templates
 */
@RestController
@RequestMapping("/api/v1/admin/fee-templates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
@Tag(name = "Fee Templates", description = "Define reusable fee structures and assign them to classes")
public class FeeTemplateController {

    private final FeeTemplateRepository templateRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final StudentRepository studentRepository;
    private final FeeRepository feeRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all fee templates for this school")
    public ResponseEntity<ApiResponse<List<FeeTemplateResponse>>> list() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                templateRepository.findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(schoolId)
                        .stream().map(this::toResponse).toList()));
    }

    @PostMapping
    @Operation(summary = "Create a fee template")
    public ResponseEntity<ApiResponse<FeeTemplateResponse>> create(
            @Valid @RequestBody CreateFeeTemplateRequest req) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School not found"));

        FeeTemplate t = apply(new FeeTemplate(), req);
        t.setSchool(school);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fee template created", toResponse(templateRepository.save(t))));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a fee template")
    public ResponseEntity<ApiResponse<FeeTemplateResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CreateFeeTemplateRequest req) {
        FeeTemplate t = require(id);
        apply(t, req);
        return ResponseEntity.ok(ApiResponse.success("Fee template updated", toResponse(templateRepository.save(t))));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate or deactivate a fee template")
    public ResponseEntity<ApiResponse<FeeTemplateResponse>> setStatus(
            @PathVariable Long id, @RequestParam String status) {
        FeeTemplate t = require(id);
        String s = status == null ? "" : status.trim().toUpperCase();
        if (!s.equals("ACTIVE") && !s.equals("INACTIVE")) {
            throw new BusinessException("Status must be ACTIVE or INACTIVE");
        }
        t.setStatus(s);
        return ResponseEntity.ok(ApiResponse.success("Status updated", toResponse(templateRepository.save(t))));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a fee template")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        FeeTemplate t = require(id);
        t.setDeleted(true);
        templateRepository.save(t);
        return ResponseEntity.ok(ApiResponse.success("Fee template deleted", null));
    }

    // ── Assign to a class ──────────────────────────────────────────────────────

    @PostMapping("/{id}/assign/class/{classId}")
    @Operation(summary = "Generate fee records for every enrolled student in a class from this template")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignToClass(
            @PathVariable Long id, @PathVariable Long classId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        FeeTemplate t = require(id);
        SchoolClass cls = classRepository.findById(classId)
                .filter(c -> c.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));

        LocalDate dueDate = computeDueDate(t);
        String period = computePeriod(t, dueDate);
        BigDecimal discount = computeConcession(t);

        int[] counts = { 0, 0 };   // created, skipped
        int students = 0;
        List<Section> sections = sectionRepository.findBySchoolClassIdAndDeletedFalse(classId);
        for (Section section : sections) {
            for (Student student : studentRepository.findBySectionId(section.getId())) {
                students++;
                applyToStudent(t, student, schoolId, cls.getSchool(), dueDate, period, discount, counts);
            }
        }

        String message = students == 0
                ? "No enrolled students found in " + cls.getName() + ". Enrol students first, then assign."
                : "Assigned to " + counts[0] + " student(s)" + (counts[1] > 0 ? ", " + counts[1] + " already had this fee." : ".");

        return ResponseEntity.ok(ApiResponse.success(message, Map.of(
                "className", cls.getName(),
                "studentsInClass", students,
                "feesCreated", counts[0],
                "skipped", counts[1],
                "period", period
        )));
    }

    // ── Unified apply: CLASS | SECTION | STUDENT ───────────────────────────────

    @PostMapping("/{id}/apply")
    @Operation(summary = "Apply a template to a class, a section, or a single student")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> apply(
            @PathVariable Long id, @Valid @RequestBody ApplyFeeTemplateRequest req) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        FeeTemplate t = require(id);
        LocalDate dueDate = computeDueDate(t);
        String period = computePeriod(t, dueDate);
        BigDecimal discount = computeConcession(t);
        School school = t.getSchool();

        String scope = req.getScope() == null ? "" : req.getScope().trim().toUpperCase();
        List<Student> students;
        String targetLabel;

        switch (scope) {
            case "CLASS" -> {
                if (req.getClassId() == null) throw new BusinessException("Please select a class.");
                SchoolClass cls = classRepository.findById(req.getClassId())
                        .filter(c -> c.getSchool().getId().equals(schoolId))
                        .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
                students = sectionRepository.findBySchoolClassIdAndDeletedFalse(cls.getId()).stream()
                        .flatMap(sec -> studentRepository.findBySectionId(sec.getId()).stream())
                        .toList();
                targetLabel = cls.getName();
            }
            case "SECTION" -> {
                if (req.getSectionId() == null) throw new BusinessException("Please select a section.");
                Section section = sectionRepository.findById(req.getSectionId())
                        .filter(sec -> sec.getSchoolClass() != null
                                && sec.getSchoolClass().getSchool().getId().equals(schoolId))
                        .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
                students = studentRepository.findBySectionId(section.getId());
                targetLabel = section.getSchoolClass().getName() + " · " + section.getName();
            }
            case "STUDENT" -> {
                if (req.getStudentId() == null) throw new BusinessException("Please select a student.");
                Student student = studentRepository.findById(req.getStudentId())
                        .filter(st -> st.getSchool().getId().equals(schoolId) && !st.isDeleted())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                students = List.of(student);
                targetLabel = (student.getFirstName() + " " + student.getLastName()).trim();
            }
            default -> throw new BusinessException("Scope must be CLASS, SECTION or STUDENT");
        }

        int[] counts = { 0, 0 };
        for (Student student : students) {
            applyToStudent(t, student, schoolId, school, dueDate, period, discount, counts);
        }

        String message = students.isEmpty()
                ? "No enrolled students found for " + targetLabel + "."
                : "Applied '" + t.getName() + "' to " + counts[0] + " student(s)"
                        + (counts[1] > 0 ? ", " + counts[1] + " already had this fee." : ".");

        return ResponseEntity.ok(ApiResponse.success(message, Map.of(
                "target", targetLabel,
                "students", students.size(),
                "feesCreated", counts[0],
                "skipped", counts[1],
                "period", period
        )));
    }

    /** Create the fee for one student unless they already have this category+period; bumps counts {created, skipped}. */
    private void applyToStudent(FeeTemplate t, Student student, Long schoolId, School school,
                                LocalDate dueDate, String period, BigDecimal discount, int[] counts) {
        boolean exists = feeRepository
                .findBySchoolIdAndStudentIdAndAcademicYearAndDeletedFalse(schoolId, student.getId(), t.getAcademicYear())
                .stream()
                .anyMatch(f -> t.getFeeType().equals(f.getFeeCategory()) && period.equals(f.getFeePeriod()));
        if (exists) { counts[1]++; return; }

        feeRepository.save(Fee.builder()
                .school(school)
                .student(student)
                .feeCategory(t.getFeeType())
                .academicYear(t.getAcademicYear())
                .feePeriod(period)
                .amount(t.getAmount())
                .discount(discount)
                .fine(BigDecimal.ZERO)
                .dueDate(dueDate)
                .status(FeeStatus.PENDING)
                .remarks("Generated from template: " + t.getName())
                .build());
        counts[0]++;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private FeeTemplate require(Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        FeeTemplate t = templateRepository.findById(id)
                .filter(x -> !x.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Fee template not found"));
        if (!t.getSchool().getId().equals(schoolId)) {
            throw new UnauthorizedException("Access denied");
        }
        return t;
    }

    private FeeTemplate apply(FeeTemplate t, CreateFeeTemplateRequest r) {
        t.setName(r.getName());
        t.setFeeType(r.getFeeType());
        t.setAmount(r.getAmount());
        t.setFrequency(r.getFrequency() != null ? r.getFrequency() : "MONTHLY");
        t.setDueDayOfMonth(r.getDueDayOfMonth());
        t.setGraceDays(r.getGraceDays() != null ? r.getGraceDays() : 0);
        t.setLateFeeEnabled(r.isLateFeeEnabled());
        t.setLateFeeAmount(r.getLateFeeAmount());
        t.setRepeatedLateFeeAmount(r.getRepeatedLateFeeAmount());
        t.setPartialAllowed(r.isPartialAllowed());
        t.setMinPartialPercent(r.isPartialAllowed() ? r.getMinPartialPercent() : null);
        t.setReminderDaysBefore(r.getReminderDaysBefore());
        t.setReminderOnDueDate(r.isReminderOnDueDate());
        t.setReminderDaysAfter(r.getReminderDaysAfter());
        t.setConcessionType(r.getConcessionType() != null ? r.getConcessionType() : "NONE");
        t.setConcessionValue(r.getConcessionValue());
        t.setAcademicYear(r.getAcademicYear());
        if (r.getStatus() != null) t.setStatus(r.getStatus());
        return t;
    }

    private LocalDate computeDueDate(FeeTemplate t) {
        YearMonth ym = YearMonth.now();
        int day = t.getDueDayOfMonth() != null ? Math.min(Math.max(t.getDueDayOfMonth(), 1), ym.lengthOfMonth()) : ym.lengthOfMonth();
        LocalDate date = ym.atDay(day);
        // If already past this month's due day, bill for next month
        if (date.isBefore(LocalDate.now())) {
            YearMonth next = ym.plusMonths(1);
            date = next.atDay(Math.min(Math.max(t.getDueDayOfMonth() != null ? t.getDueDayOfMonth() : next.lengthOfMonth(), 1), next.lengthOfMonth()));
        }
        return date;
    }

    private String computePeriod(FeeTemplate t, LocalDate dueDate) {
        String freq = t.getFrequency() == null ? "MONTHLY" : t.getFrequency();
        return switch (freq) {
            case "MONTHLY" -> dueDate.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + dueDate.getYear();
            case "QUARTERLY" -> "Q" + (((dueDate.getMonthValue() - 1) / 3) + 1) + " " + t.getAcademicYear();
            case "HALF_YEARLY" -> (dueDate.getMonthValue() <= 6 ? "H1 " : "H2 ") + t.getAcademicYear();
            default -> t.getAcademicYear(); // ANNUAL | ONE_TIME
        };
    }

    private BigDecimal computeConcession(FeeTemplate t) {
        if (t.getConcessionValue() == null || "NONE".equals(t.getConcessionType())) return BigDecimal.ZERO;
        if ("PERCENT".equals(t.getConcessionType())) {
            return t.getAmount().multiply(t.getConcessionValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        return t.getConcessionValue(); // FIXED
    }

    private FeeTemplateResponse toResponse(FeeTemplate t) {
        return FeeTemplateResponse.builder()
                .id(t.getId())
                .schoolId(t.getSchool().getId())
                .name(t.getName())
                .feeType(t.getFeeType())
                .amount(t.getAmount())
                .frequency(t.getFrequency())
                .dueDayOfMonth(t.getDueDayOfMonth())
                .graceDays(t.getGraceDays())
                .lateFeeEnabled(t.isLateFeeEnabled())
                .lateFeeAmount(t.getLateFeeAmount())
                .repeatedLateFeeAmount(t.getRepeatedLateFeeAmount())
                .partialAllowed(t.isPartialAllowed())
                .minPartialPercent(t.getMinPartialPercent())
                .reminderDaysBefore(t.getReminderDaysBefore())
                .reminderOnDueDate(t.isReminderOnDueDate())
                .reminderDaysAfter(t.getReminderDaysAfter())
                .concessionType(t.getConcessionType())
                .concessionValue(t.getConcessionValue())
                .academicYear(t.getAcademicYear())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
