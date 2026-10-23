package com.sms.school.controller;

import com.sms.school.dto.request.UpdateBusLocationRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.BusLocationResponse;
import com.sms.school.security.TenantContext;
import com.sms.school.service.BusTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for the bus tracking module.
 * Live updates are also pushed via WebSocket (/topic/bus/{vehicleId}).
 */
@RestController
@RequestMapping("/api/v1/bus")
@RequiredArgsConstructor
@Tag(name = "Bus Tracking", description = "GPS tracking and live location")
public class BusController {

    private final BusTrackingService busTrackingService;

    @PostMapping("/location")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Update bus GPS location (called by driver app)")
    public ResponseEntity<ApiResponse<BusLocationResponse>> updateLocation(
            @Valid @RequestBody UpdateBusLocationRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        BusLocationResponse response = busTrackingService.updateLocation(schoolId, request);
        return ResponseEntity.ok(ApiResponse.success("Location updated", response));
    }

    @GetMapping("/live-location/{vehicleId}")
    @Operation(summary = "Get latest GPS location of a bus")
    public ResponseEntity<ApiResponse<BusLocationResponse>> getLiveLocation(
            @PathVariable Long vehicleId) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        BusLocationResponse response = busTrackingService.getLiveLocation(schoolId, vehicleId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
