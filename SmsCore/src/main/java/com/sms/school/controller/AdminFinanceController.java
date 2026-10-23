package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.payment.GatewayAccountService;
import com.sms.school.payment.ReconciliationService;
import com.sms.school.payment.dto.PaymentDtos.*;
import com.sms.school.payment.entity.ReconciliationRun;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** School Admin → Finance: payments, 3-way reconciliation, exceptions, refunds, gateway config. */
@RestController
@RequestMapping("/api/v1/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ACCOUNTANT','SCHOOL_ADMIN','SUPER_ADMIN') and !hasRole('SUPPORT_STAFF')")
@Tag(name = "Admin Finance", description = "Payment records, reconciliation and refunds")
public class AdminFinanceController {

    private final ReconciliationService recon;
    private final GatewayAccountService gatewayAccounts;

    // ── Payments ──────────────────────────────────────────────────────────────

    @GetMapping("/payments")
    @Operation(summary = "Search this school's online payment records")
    public ResponseEntity<ApiResponse<Page<PaymentView>>> payments(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(recon.listPayments(schoolId, PageRequest.of(page, size))));
    }

    @PostMapping("/payments/{id}/refunds")
    @Operation(summary = "Request a refund for a captured payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refund(
            @PathVariable Long id, @RequestBody RefundRequest req) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Refund requested",
                recon.refund(schoolId, id, req.getAmount(), req.getReason(), userId)));
    }

    // ── Reconciliation ────────────────────────────────────────────────────────

    @GetMapping("/reconciliation")
    @Operation(summary = "Reconciliation dashboard summary")
    public ResponseEntity<ApiResponse<ReconSummary>> summary() {
        return ResponseEntity.ok(ApiResponse.success(recon.summary(TenantContext.getCurrentSchoolId())));
    }

    @PostMapping("/reconciliation/runs")
    @Operation(summary = "Start a reconciliation run for a date range")
    public ResponseEntity<ApiResponse<ReconciliationRun>> runRecon(
            @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        LocalDate t = to != null ? to : LocalDate.now();
        LocalDate f = from != null ? from : t.minusDays(30);
        return ResponseEntity.ok(ApiResponse.success("Reconciliation complete", recon.run(schoolId, f, t, "MANUAL")));
    }

    @GetMapping("/reconciliation/runs")
    @Operation(summary = "Past reconciliation runs")
    public ResponseEntity<ApiResponse<List<ReconciliationRun>>> runs() {
        return ResponseEntity.ok(ApiResponse.success(recon.listRuns(TenantContext.getCurrentSchoolId())));
    }

    @GetMapping("/reconciliation/exceptions")
    @Operation(summary = "Unmatched / inconsistent entries requiring attention")
    public ResponseEntity<ApiResponse<List<ExceptionView>>> exceptions(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(
                recon.listExceptions(TenantContext.getCurrentSchoolId(), status)));
    }

    @PostMapping("/reconciliation/exceptions/{id}/resolve")
    @Operation(summary = "Record an authorized resolution for an exception")
    public ResponseEntity<ApiResponse<ExceptionView>> resolve(
            @PathVariable Long id, @RequestBody ResolveExceptionRequest req) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Long userId = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Exception updated", recon.resolveException(schoolId, id, req, userId)));
    }

    @PostMapping("/settlements/import")
    @Operation(summary = "Import Razorpay settlements for a date range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importSettlements(
            @RequestParam LocalDate from, @RequestParam LocalDate to) {
        int n = recon.importSettlements(TenantContext.getCurrentSchoolId(), from, to);
        return ResponseEntity.ok(ApiResponse.success("Imported " + n + " settlement(s)", Map.of("imported", n)));
    }

    @PostMapping("/bank-statement/import")
    @Operation(summary = "Upload a bank statement CSV and match credits to settlements")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importBank(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Bank statement processed",
                recon.importBankStatement(TenantContext.getCurrentSchoolId(), file)));
    }

    // ── Gateway configuration (per-school Razorpay keys) ───────────────────────

    @GetMapping("/gateway-accounts")
    @Operation(summary = "List this school's Razorpay gateway accounts (secrets never returned)")
    public ResponseEntity<ApiResponse<List<GatewayAccountView>>> listAccounts() {
        return ResponseEntity.ok(ApiResponse.success(gatewayAccounts.list(TenantContext.getCurrentSchoolId())));
    }

    @PostMapping("/gateway-accounts")
    @Operation(summary = "Create or update Razorpay credentials for a mode (TEST/LIVE)")
    public ResponseEntity<ApiResponse<GatewayAccountView>> saveAccount(@RequestBody GatewayAccountRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Gateway account saved",
                gatewayAccounts.save(TenantContext.getCurrentSchoolId(), req)));
    }
}
