package com.sms.school.controller;

import com.sms.school.dto.request.CreateSchoolRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.School;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.SchoolRepository;
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
@RequestMapping("/api/v1/schools")
@RequiredArgsConstructor
@Tag(name = "Schools", description = "Platform-level school management (SUPER_ADMIN only)")
public class SchoolController {

    private final SchoolRepository schoolRepository;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Register a new school on the platform")
    public ResponseEntity<ApiResponse<School>> createSchool(
            @Valid @RequestBody CreateSchoolRequest request) {

        if (schoolRepository.existsByCode(request.getCode())) {
            throw new BusinessException("School code '" + request.getCode() + "' already exists");
        }

        School school = School.builder()
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .pincode(request.getPincode())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .currentAcademicYear(request.getCurrentAcademicYear())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("School created", schoolRepository.save(school)));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all registered schools")
    public ResponseEntity<ApiResponse<List<School>>> getAllSchools() {
        return ResponseEntity.ok(ApiResponse.success(schoolRepository.findAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a school by ID")
    public ResponseEntity<ApiResponse<School>> getSchool(@PathVariable Long id) {
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School", id));
        return ResponseEntity.ok(ApiResponse.success(school));
    }
}
