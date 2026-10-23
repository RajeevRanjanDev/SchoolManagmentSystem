package com.sms.school.controller;

import com.sms.school.dto.request.CreateClassRequest;
import com.sms.school.dto.request.CreateSectionRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.SchoolClassResponse;
import com.sms.school.dto.response.SectionResponse;
import com.sms.school.entity.School;
import com.sms.school.entity.SchoolClass;
import com.sms.school.entity.Section;
import com.sms.school.entity.Student;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.exception.UnauthorizedException;
import com.sms.school.repository.SchoolClassRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.SectionRepository;
import com.sms.school.repository.StudentClassMappingRepository;
import com.sms.school.repository.StudentRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-facing CRUD endpoints for SchoolClass and Section.
 *
 * Base: /api/v1/admin
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Class & Section Management", description = "Create and manage classes and sections")
public class ClassSectionController {

    private final SchoolClassRepository classRepository;
    private final SectionRepository sectionRepository;
    private final SchoolRepository schoolRepository;
    private final StudentRepository studentRepository;
    private final StudentClassMappingRepository classMappingRepository;

    // ── Classes ───────────────────────────────────────────────────────────────

    @GetMapping("/classes")
    @Operation(summary = "List all classes for this school (optionally filter by academic year)")
    public ResponseEntity<ApiResponse<List<SchoolClassResponse>>> getClasses(
            @RequestParam(required = false) String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        List<SchoolClass> classes = (academicYear != null && !academicYear.isBlank())
                ? classRepository.findBySchoolIdAndAcademicYearAndDeletedFalse(schoolId, academicYear)
                : classRepository.findBySchoolIdAndDeletedFalse(schoolId);

        List<SchoolClassResponse> response = classes.stream()
                .map(this::toClassResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/classes")
    @Operation(summary = "Create a new class")
    public ResponseEntity<ApiResponse<SchoolClassResponse>> createClass(
            @Valid @RequestBody CreateClassRequest req) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School not found"));

        SchoolClass saved = classRepository.save(SchoolClass.builder()
                .school(school)
                .name(req.getName())
                .numericName(req.getNumericName())
                .academicYear(req.getAcademicYear())
                .status("ACTIVE")
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Class created", toClassResponse(saved)));
    }

    @PutMapping("/classes/{classId}")
    @Operation(summary = "Edit class details")
    public ResponseEntity<ApiResponse<SchoolClassResponse>> updateClass(
            @PathVariable Long classId,
            @Valid @RequestBody CreateClassRequest req) {

        SchoolClass cls = requireClass(classId);
        cls.setName(req.getName());
        cls.setNumericName(req.getNumericName());
        if (req.getAcademicYear() != null && !req.getAcademicYear().isBlank()) {
            cls.setAcademicYear(req.getAcademicYear());
        }
        return ResponseEntity.ok(ApiResponse.success("Class updated", toClassResponse(classRepository.save(cls))));
    }

    @PatchMapping("/classes/{classId}/status")
    @Operation(summary = "Activate or deactivate a class (ACTIVE | INACTIVE)")
    public ResponseEntity<ApiResponse<SchoolClassResponse>> updateClassStatus(
            @PathVariable Long classId,
            @RequestParam String status) {

        SchoolClass cls = requireClass(classId);
        cls.setStatus(normalizeStatus(status));
        return ResponseEntity.ok(ApiResponse.success(
                "Class " + cls.getStatus().toLowerCase() + "d", toClassResponse(classRepository.save(cls))));
    }

    @DeleteMapping("/classes/{classId}")
    @Operation(summary = "Delete a class — blocked if students are enrolled in any of its sections")
    public ResponseEntity<ApiResponse<Void>> deleteClass(@PathVariable Long classId) {
        SchoolClass cls = requireClass(classId);

        List<Section> sections = sectionRepository.findBySchoolClassIdAndDeletedFalse(classId);
        long students = sections.stream().mapToLong(s -> studentRepository.countBySectionId(s.getId())).sum();
        if (students > 0) {
            throw new BusinessException(
                    "Cannot delete this class: " + students + " student(s) are still enrolled. Deactivate it instead.");
        }

        // Safe to remove — soft-delete the class and its (empty) sections
        sections.forEach(s -> { s.setDeleted(true); sectionRepository.save(s); });
        cls.setDeleted(true);
        classRepository.save(cls);
        return ResponseEntity.ok(ApiResponse.success("Class deleted", null));
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    @GetMapping("/classes/{classId}/sections")
    @Operation(summary = "List all sections for a class")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getSections(
            @PathVariable Long classId) {

        List<Section> sections = sectionRepository.findBySchoolClassIdAndDeletedFalse(classId);
        return ResponseEntity.ok(ApiResponse.success(
                sections.stream().map(this::toSectionResponse).toList()));
    }

    @PostMapping("/classes/{classId}/sections")
    @Operation(summary = "Create a section within a class")
    public ResponseEntity<ApiResponse<SectionResponse>> createSection(
            @PathVariable Long classId,
            @Valid @RequestBody CreateSectionRequest req) {

        SchoolClass cls = requireClass(classId);

        String name = req.getName() == null ? "" : req.getName().trim().toUpperCase();
        boolean duplicate = sectionRepository.findBySchoolClassIdAndDeletedFalse(classId).stream()
                .anyMatch(s -> s.getName() != null && s.getName().trim().equalsIgnoreCase(name));
        if (duplicate) {
            throw new BusinessException("Section \"" + name + "\" already exists in " + cls.getName() + ".");
        }

        Section saved = sectionRepository.save(Section.builder()
                .school(cls.getSchool())
                .schoolClass(cls)
                .name(name)
                .maxCapacity(req.getMaxCapacity())
                .status("ACTIVE")
                .build());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Section created", toSectionResponse(saved)));
    }

    @PutMapping("/sections/{sectionId}")
    @Operation(summary = "Edit section details")
    public ResponseEntity<ApiResponse<SectionResponse>> updateSection(
            @PathVariable Long sectionId,
            @Valid @RequestBody CreateSectionRequest req) {

        Section section = requireSection(sectionId);
        String name = req.getName() == null ? "" : req.getName().trim().toUpperCase();
        boolean duplicate = sectionRepository.findBySchoolClassIdAndDeletedFalse(section.getSchoolClass().getId()).stream()
                .anyMatch(s -> !s.getId().equals(sectionId)
                        && s.getName() != null && s.getName().trim().equalsIgnoreCase(name));
        if (duplicate) {
            throw new BusinessException("Another section \"" + name + "\" already exists in this class.");
        }
        section.setName(name);
        section.setMaxCapacity(req.getMaxCapacity());
        return ResponseEntity.ok(ApiResponse.success("Section updated", toSectionResponse(sectionRepository.save(section))));
    }

    @PatchMapping("/sections/{sectionId}/status")
    @Operation(summary = "Activate or deactivate a section (ACTIVE | INACTIVE)")
    public ResponseEntity<ApiResponse<SectionResponse>> updateSectionStatus(
            @PathVariable Long sectionId,
            @RequestParam String status) {

        Section section = requireSection(sectionId);
        section.setStatus(normalizeStatus(status));
        return ResponseEntity.ok(ApiResponse.success(
                "Section " + section.getStatus().toLowerCase() + "d", toSectionResponse(sectionRepository.save(section))));
    }

    @GetMapping("/sections/{sectionId}/students")
    @PreAuthorize("hasAnyRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List students enrolled in a section (roster for attendance, exams, etc.), sorted by roll")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSectionStudents(@PathVariable Long sectionId) {
        requireSection(sectionId);
        List<Map<String, Object>> roster = classMappingRepository.findActiveBySection(sectionId).stream()
                .map(m -> {
                    Student st = m.getStudent();
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", st.getId());
                    row.put("firstName", st.getFirstName());
                    row.put("lastName", st.getLastName());
                    row.put("admissionNumber", st.getAdmissionNumber());
                    row.put("rollNumber", m.getRollNumber());
                    return row;
                })
                .sorted(Comparator.comparingInt(r -> rollSort((String) r.get("rollNumber"))))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(roster));
    }

    private int rollSort(String roll) {
        if (roll == null) return Integer.MAX_VALUE;
        try { return Integer.parseInt(roll.trim()); } catch (NumberFormatException e) { return Integer.MAX_VALUE; }
    }

    @GetMapping("/sections/{sectionId}/impact")
    @Operation(summary = "Check what is linked to a section before deactivating or deleting it")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSectionImpact(@PathVariable Long sectionId) {
        requireSection(sectionId);
        long students = studentRepository.countBySectionId(sectionId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "studentCount", students,
                "hasStudents", students > 0,
                "canDelete", students == 0
        )));
    }

    @DeleteMapping("/sections/{sectionId}")
    @Operation(summary = "Delete a section — blocked if students are enrolled")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Long sectionId) {
        Section section = requireSection(sectionId);

        long students = studentRepository.countBySectionId(sectionId);
        if (students > 0) {
            throw new BusinessException(
                    "Cannot delete this section: " + students + " student(s) are still enrolled. Deactivate it instead.");
        }
        section.setDeleted(true);
        sectionRepository.save(section);
        return ResponseEntity.ok(ApiResponse.success("Section deleted", null));
    }

    // ── All sections for this school (flat list, useful for dropdowns) ────────

    @GetMapping("/sections")
    @Operation(summary = "List all sections for this school (flat, for pickers)")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getAllSections() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        List<Section> sections = sectionRepository.findBySchoolIdAndDeletedFalse(schoolId);
        return ResponseEntity.ok(ApiResponse.success(
                sections.stream().map(this::toSectionResponse).toList()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private SchoolClass requireClass(Long classId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        SchoolClass cls = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found"));
        if (!cls.getSchool().getId().equals(schoolId)) {
            throw new UnauthorizedException("Access denied");
        }
        return cls;
    }

    private Section requireSection(Long sectionId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        if (!section.getSchool().getId().equals(schoolId)) {
            throw new UnauthorizedException("Access denied");
        }
        return section;
    }

    private String normalizeStatus(String status) {
        String s = status == null ? "" : status.trim().toUpperCase();
        if (!s.equals("ACTIVE") && !s.equals("INACTIVE")) {
            throw new BusinessException("Status must be ACTIVE or INACTIVE");
        }
        return s;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private SchoolClassResponse toClassResponse(SchoolClass cls) {
        List<Section> sections = sectionRepository.findBySchoolClassIdAndDeletedFalse(cls.getId());
        long students = sections.stream().mapToLong(s -> studentRepository.countBySectionId(s.getId())).sum();
        return SchoolClassResponse.builder()
                .id(cls.getId())
                .schoolId(cls.getSchool().getId())
                .name(cls.getName())
                .numericName(cls.getNumericName())
                .academicYear(cls.getAcademicYear())
                .status(cls.getStatus() != null ? cls.getStatus() : "ACTIVE")
                .sectionCount(sections.size())
                .studentCount(students)
                .createdAt(cls.getCreatedAt())
                .build();
    }

    private SectionResponse toSectionResponse(Section s) {
        String teacherName = null;
        Long teacherId = null;
        if (s.getClassTeacher() != null && s.getClassTeacher().getUser() != null) {
            teacherId = s.getClassTeacher().getId();
            teacherName = s.getClassTeacher().getUser().getFirstName()
                    + " " + s.getClassTeacher().getUser().getLastName();
        }
        return SectionResponse.builder()
                .id(s.getId())
                .schoolId(s.getSchool().getId())
                .classId(s.getSchoolClass().getId())
                .className(s.getSchoolClass().getName())
                .name(s.getName())
                .maxCapacity(s.getMaxCapacity())
                .classTeacherId(teacherId)
                .classTeacherName(teacherName)
                .status(s.getStatus() != null ? s.getStatus() : "ACTIVE")
                .studentCount(studentRepository.countBySectionId(s.getId()))
                .build();
    }
}
