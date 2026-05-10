package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.School;
import com.sms.school.entity.Section;
import com.sms.school.entity.Teacher;
import com.sms.school.entity.Timetable;
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

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/timetable")
@RequiredArgsConstructor
@Tag(name = "Timetable", description = "Weekly class schedule")
public class TimetableController {

    private final TimetableRepository timetableRepository;
    private final SchoolRepository schoolRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create a timetable period entry")
    public ResponseEntity<ApiResponse<Timetable>> createEntry(
            @RequestParam Long sectionId,
            @RequestParam Long teacherId,
            @RequestParam String subject,
            @RequestParam int dayOfWeek,
            @RequestParam int periodNumber,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam String academicYear) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));

        Timetable entry = Timetable.builder()
                .school(school).section(section).teacher(teacher)
                .subject(subject).dayOfWeek(dayOfWeek).periodNumber(periodNumber)
                .startTime(LocalTime.parse(startTime)).endTime(LocalTime.parse(endTime))
                .academicYear(academicYear).build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Entry created", timetableRepository.save(entry)));
    }

    @GetMapping("/section/{sectionId}")
    @Operation(summary = "Get full timetable for a section")
    public ResponseEntity<ApiResponse<List<Timetable>>> getSectionTimetable(
            @PathVariable Long sectionId,
            @RequestParam String academicYear) {

        return ResponseEntity.ok(ApiResponse.success(
                timetableRepository.findBySectionIdAndAcademicYearAndDeletedFalse(sectionId, academicYear)));
    }

    @GetMapping("/teacher/{teacherId}")
    @Operation(summary = "Get a teacher's timetable")
    public ResponseEntity<ApiResponse<List<Timetable>>> getTeacherTimetable(
            @PathVariable Long teacherId,
            @RequestParam String academicYear) {

        return ResponseEntity.ok(ApiResponse.success(
                timetableRepository.findByTeacherIdAndAcademicYearAndDeletedFalse(teacherId, academicYear)));
    }
}
