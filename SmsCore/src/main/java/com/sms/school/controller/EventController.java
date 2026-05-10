package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Event;
import com.sms.school.entity.EventPhoto;
import com.sms.school.entity.School;
import com.sms.school.entity.User;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.*;
import com.sms.school.security.TenantContext;
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
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events & Gallery", description = "School events and photo gallery")
public class EventController {

    private final EventRepository eventRepository;
    private final EventPhotoRepository photoRepository;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create a school event")
    public ResponseEntity<ApiResponse<Event>> createEvent(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam LocalDate eventDate,
            @RequestParam(required = false) String venue,
            @RequestParam(defaultValue = "false") boolean publish) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Event event = Event.builder()
                .school(school).title(title).description(description)
                .eventDate(eventDate).venue(venue).published(publish).createdByUser(creator)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created", eventRepository.save(event)));
    }

    @GetMapping
    @Operation(summary = "List published events")
    public ResponseEntity<ApiResponse<Page<Event>>> getEvents(
            @PageableDefault(size = 20) Pageable pageable) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                eventRepository.findBySchoolIdAndPublishedTrueAndDeletedFalse(schoolId, pageable)));
    }

    @PostMapping("/{eventId}/photos")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'TEACHER', 'SUPER_ADMIN')")
    @Operation(summary = "Upload a photo to an event's gallery")
    public ResponseEntity<ApiResponse<EventPhoto>> addPhoto(
            @PathVariable Long eventId,
            @RequestParam String photoUrl,
            @RequestParam(required = false) String caption) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));
        User uploadedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        EventPhoto photo = EventPhoto.builder()
                .school(school).event(event).photoUrl(photoUrl)
                .caption(caption).uploadedBy(uploadedBy).build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Photo uploaded", photoRepository.save(photo)));
    }

    @GetMapping("/{eventId}/photos")
    @Operation(summary = "Get all photos for an event")
    public ResponseEntity<ApiResponse<List<EventPhoto>>> getPhotos(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(
                photoRepository.findByEventIdAndDeletedFalse(eventId)));
    }
}
