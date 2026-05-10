package com.sms.school.controller;

import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.FeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fees")
@RequiredArgsConstructor
@Tag(name = "Fee Management", description = "View and pay school fees")
public class FeeController {

    private final FeeService feeService;

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get all fee records for a student")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getStudentFees(
            @PathVariable Long studentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFees(schoolId, studentId)));
    }

    @GetMapping("/student/{studentId}/year/{year}")
    @Operation(summary = "Get fee records for a student filtered by academic year")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getStudentFeesByYear(
            @PathVariable Long studentId,
            @PathVariable String year) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFeesByYear(schoolId, studentId, year)));
    }

    @PostMapping("/payment")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Record a fee payment (cash/online/UPI etc.)")
    public ResponseEntity<ApiResponse<FeeResponse>> recordPayment(
            @Valid @RequestBody RecordFeePaymentRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId = TenantContext.getCurrentUserId();
        FeeResponse response = feeService.recordPayment(schoolId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Payment recorded", response));
    }

    @GetMapping("/history/student/{studentId}")
    @Operation(summary = "Fee payment history for a student (alias for parent app)")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getFeeHistory(
            @PathVariable Long studentId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFees(schoolId, studentId)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all pending fees for the school")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getPendingFees() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(feeService.getPendingFees(schoolId)));
    }
}
