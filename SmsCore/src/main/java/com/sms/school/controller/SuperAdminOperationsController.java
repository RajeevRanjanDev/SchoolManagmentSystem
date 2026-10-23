package com.sms.school.controller;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.ops.OperationsService;
import com.sms.school.ops.dto.OpsDtos.*;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Super Admin → Operations & System Health: platform-wide failure tracking. */
@RestController
@RequestMapping("/api/v1/super/operations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Operations", description = "Platform error tracking and incident resolution")
public class SuperAdminOperationsController {

    private final OperationsService ops;

    @GetMapping("/summary")
    @Operation(summary = "Operations summary counts for a time range (hours)")
    public ResponseEntity<ApiResponse<OpsSummary>> summary(@RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(ApiResponse.success(ops.summary(hours)));
    }

    @GetMapping("/errors")
    @Operation(summary = "Search captured failures (filter by school, service, severity, status, time range)")
    public ResponseEntity<ApiResponse<Page<ErrorLogView>>> search(
            @RequestParam(required = false) Long schoolId,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                ops.search(schoolId, service, severity, status, hours, PageRequest.of(page, size))));
    }

    @GetMapping("/errors/{id}")
    @Operation(summary = "Full detail (incl. stack trace) for a captured failure")
    public ResponseEntity<ApiResponse<ErrorLogView>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(ops.detail(id)));
    }

    @PostMapping("/errors/{id}/resolve")
    @Operation(summary = "Mark an incident as investigating/resolved with a note")
    public ResponseEntity<ApiResponse<ErrorLogView>> resolve(
            @PathVariable Long id, @RequestBody ResolveRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Incident updated",
                ops.resolve(id, req, TenantContext.getCurrentUserId())));
    }

    @GetMapping("/services")
    @Operation(summary = "Distinct services seen in captured failures (for filters)")
    public ResponseEntity<ApiResponse<List<String>>> services() {
        return ResponseEntity.ok(ApiResponse.success(ops.services()));
    }
}
