package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Circular;
import com.sms.school.entity.School;
import com.sms.school.entity.User;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.CircularRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.security.TenantContext;
import com.sms.school.service.NotificationService;
import com.sms.school.entity.enums.NotificationType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/circulars")
@RequiredArgsConstructor
@Tag(name = "Circulars", description = "School circulars and announcements")
public class CircularController {

    private final CircularRepository circularRepository;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER')")
    @Operation(summary = "Create and publish a circular")
    public ResponseEntity<ApiResponse<Circular>> createCircular(
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(defaultValue = "true") boolean publish) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        User publishedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Circular circular = Circular.builder()
                .school(school)
                .title(title)
                .content(content)
                .publishedDate(LocalDate.now())
                .published(publish)
                .publishedBy(publishedBy)
                .build();

        Circular saved = circularRepository.save(circular);

        // Notify all school users when published
        if (publish) {
            notificationService.broadcastToSchool(schoolId,
                    "New Circular: " + title, content, NotificationType.CIRCULAR);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Circular created", saved));
    }

    @GetMapping
    @Operation(summary = "List published circulars (parents/teachers see this)")
    public ResponseEntity<ApiResponse<Page<Circular>>> getPublished(
            @PageableDefault(size = 20) Pageable pageable) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                circularRepository.findBySchoolIdAndPublishedTrueAndDeletedFalse(schoolId, pageable)));
    }
}
