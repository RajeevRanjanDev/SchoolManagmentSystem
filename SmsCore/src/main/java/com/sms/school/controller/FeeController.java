package com.sms.school.controller;

import com.sms.school.dto.request.CreateFeeRequest;
import com.sms.school.dto.request.RecordFeePaymentRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.FeePaymentResponse;
import com.sms.school.dto.response.FeeResponse;
import com.sms.school.dto.response.FeeSummaryResponse;
import com.sms.school.dto.response.StudentFeeSummaryResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.FeeService;
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
@RequestMapping("/api/v1/fees")
@RequiredArgsConstructor
@Tag(name = "Fee Management", description = "Create, view, and collect school fees")
public class FeeController {

    private final FeeService feeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Create a new fee record for a student")
    public ResponseEntity<ApiResponse<FeeResponse>> createFee(
            @Valid @RequestBody CreateFeeRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        FeeResponse response = feeService.createFee(schoolId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fee record created", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Get all fee records for the school (optional: filter by status or academic year)")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getAllFees(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getAllFees(schoolId, status, academicYear)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Get fee summary stats for the school (collected, pending, overdue)")
    public ResponseEntity<ApiResponse<FeeSummaryResponse>> getFeeSummary(
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getFeeSummary(schoolId, academicYear)));
    }

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
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Record a fee payment (cash/online/UPI/cheque)")
    public ResponseEntity<ApiResponse<FeeResponse>> recordPayment(
            @Valid @RequestBody RecordFeePaymentRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId   = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Payment recorded",
                feeService.recordPayment(schoolId, userId, request)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "List all PENDING fees for the school")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getPendingFees() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(feeService.getPendingFees(schoolId)));
    }

    @GetMapping("/history/student/{studentId}")
    @Operation(summary = "Fee payment history for a student")
    public ResponseEntity<ApiResponse<List<FeeResponse>>> getFeeHistory(
            @PathVariable Long studentId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getStudentFees(schoolId, studentId)));
    }

    @GetMapping("/student/{studentId}/payments")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Full payment/transaction history for a student")
    public ResponseEntity<ApiResponse<List<FeePaymentResponse>>> getStudentPayments(
            @PathVariable Long studentId) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(feeService.getStudentPayments(schoolId, studentId)));
    }

    @GetMapping("/section/{sectionId}/summary")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Per-student fee totals for all students in a section")
    public ResponseEntity<ApiResponse<List<StudentFeeSummaryResponse>>> getSectionFeeSummary(
            @PathVariable Long sectionId,
            @RequestParam(required = false) String academicYear) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                feeService.getSectionFeeSummary(schoolId, sectionId, academicYear)));
    }

    @PostMapping("/{feeId}/adjust")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
    @Operation(summary = "Reconcile/adjust a fee — set a discount or waive the balance. A reason is required.")
    public ResponseEntity<ApiResponse<FeeResponse>> adjustFee(
            @PathVariable Long feeId,
            @RequestParam(required = false) java.math.BigDecimal discount,
            @RequestParam(defaultValue = "false") boolean waiveRemaining,
            @RequestParam String remarks) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Fee adjusted",
                feeService.adjustFee(schoolId, feeId, discount, waiveRemaining, remarks)));
    }
}
