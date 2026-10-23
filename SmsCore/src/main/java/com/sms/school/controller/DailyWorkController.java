package com.sms.school.controller;

import com.sms.school.dto.request.CreateDailyWorkRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.DailyWorkResponse;
import com.sms.school.entity.DailyWork;
import com.sms.school.entity.School;
import com.sms.school.entity.Section;
import com.sms.school.entity.User;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.DailyWorkRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.SectionRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Simple per-day HOMEWORK / CLASSWORK for a class-section — description only,
 * posted by a class teacher or admin, fetched by section + date.
 *
 * Base: /api/v1/daily-work
 */
@RestController
@RequestMapping("/api/v1/daily-work")
@RequiredArgsConstructor
@Tag(name = "Daily Work", description = "Per-day homework & classwork for a class-section")
public class DailyWorkController {

    private final DailyWorkRepository dailyWorkRepository;
    private final SchoolRepository schoolRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Add or update the homework/classwork for a section on a date")
    public ResponseEntity<ApiResponse<DailyWorkResponse>> upsert(@Valid @RequestBody CreateDailyWorkRequest req) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        String type = normalizeType(req.getType());

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Section section = sectionRepository.findById(req.getSectionId())
                .filter(s -> s.getSchool().getId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.getSectionId()));

        // One entry per section + date + type → update if it already exists.
        DailyWork work = dailyWorkRepository
                .findBySchoolIdAndSectionIdAndWorkDateAndTypeAndDeletedFalse(schoolId, req.getSectionId(), req.getWorkDate(), type)
                .orElseGet(() -> DailyWork.builder()
                        .school(school)
                        .section(section)
                        .schoolClass(section.getSchoolClass())
                        .workDate(req.getWorkDate())
                        .type(type)
                        .build());

        work.setDescription(req.getDescription().trim());
        work.setCreatedByName(currentUserName());
        return ResponseEntity.ok(ApiResponse.success(type + " saved", toResponse(dailyWorkRepository.save(work))));
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'PARENT')")
    @Operation(summary = "Get the homework & classwork for a section on a given date")
    public ResponseEntity<ApiResponse<List<DailyWorkResponse>>> getBySectionAndDate(
            @PathVariable Long sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<DailyWorkResponse> list = dailyWorkRepository
                .findBySchoolIdAndSectionIdAndWorkDateAndDeletedFalse(schoolId, sectionId, date)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Delete a homework/classwork entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        DailyWork work = dailyWorkRepository.findById(id)
                .filter(w -> w.getSchool().getId().equals(schoolId) && !w.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Daily work", id));
        work.setDeleted(true);
        dailyWorkRepository.save(work);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private String normalizeType(String type) {
        String t = type == null ? "" : type.trim().toUpperCase();
        if (!t.equals("HOMEWORK") && !t.equals("CLASSWORK")) {
            throw new BusinessException("Type must be HOMEWORK or CLASSWORK");
        }
        return t;
    }

    private String currentUserName() {
        try {
            User u = userRepository.findById(TenantContext.getCurrentUserId()).orElse(null);
            return u != null ? (u.getFirstName() + " " + u.getLastName()).trim() : "—";
        } catch (Exception e) {
            return "—";
        }
    }

    private DailyWorkResponse toResponse(DailyWork w) {
        return DailyWorkResponse.builder()
                .id(w.getId())
                .sectionId(w.getSection().getId())
                .sectionName(w.getSection().getName())
                .className(w.getSchoolClass() != null ? w.getSchoolClass().getName() : null)
                .workDate(w.getWorkDate())
                .type(w.getType())
                .description(w.getDescription())
                .createdByName(w.getCreatedByName())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
