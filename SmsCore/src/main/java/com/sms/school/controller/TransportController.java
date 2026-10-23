package com.sms.school.controller;

import com.sms.school.dto.request.TransportRouteRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.TransportRouteResponse;
import com.sms.school.entity.School;
import com.sms.school.entity.Teacher;
import com.sms.school.entity.TransportRoute;
import com.sms.school.entity.TransportRouteStop;
import com.sms.school.entity.User;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.TeacherRepository;
import com.sms.school.repository.TransportRouteRepository;
import com.sms.school.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transport")
@RequiredArgsConstructor
@Tag(name = "Transport", description = "Transport routes, stops and incharge management")
public class TransportController {

    private final TransportRouteRepository routeRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;
    private final com.sms.school.service.admission.AdmissionService admissionService;

    // ── Students & route assignment ────────────────────────────────────────────

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER','SCHOOL_ADMIN','SUPER_ADMIN','SUPPORT_STAFF')")
    @Operation(summary = "List students with their route and pickup point (filter by class/section/route)")
    public ResponseEntity<ApiResponse<List<com.sms.school.dto.response.admission.TransportStudentResponse>>> listStudents(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) String search) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success(
                admissionService.listTransportStudents(schoolId, classId, sectionId, routeId, search)));
    }

    @PutMapping("/students/{profileId}/assign")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER','SCHOOL_ADMIN','SUPER_ADMIN','SUPPORT_STAFF')")
    @Operation(summary = "Assign or change a student's transport route from the transport screen")
    public ResponseEntity<ApiResponse<com.sms.school.dto.response.admission.StudentProfileResponse>> assignRoute(
            @PathVariable Long profileId,
            @Valid @RequestBody com.sms.school.dto.request.admission.RegisterStudentRequest.TransportInfoRequest req) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        return ResponseEntity.ok(ApiResponse.success("Route assigned",
                admissionService.updateTransport(schoolId, profileId, req)));
    }

    @GetMapping("/routes")
    @Transactional(readOnly = true)
    @Operation(summary = "List all transport routes for the school")
    public ResponseEntity<ApiResponse<List<TransportRouteResponse>>> listRoutes() {
        Long schoolId = TenantContext.getCurrentSchoolId();
        List<TransportRouteResponse> routes = routeRepository
                .findBySchoolIdAndDeletedFalseOrderByRouteNumberAsc(schoolId)
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(routes));
    }

    @PostMapping("/routes")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Transactional
    @Operation(summary = "Create a transport route with stops and an optional incharge")
    public ResponseEntity<ApiResponse<TransportRouteResponse>> createRoute(
            @Valid @RequestBody TransportRouteRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        String routeNumber = request.getRouteNumber().trim();
        if (routeRepository.existsBySchoolIdAndRouteNumberAndDeletedFalse(schoolId, routeNumber)) {
            throw new BusinessException("Route number '" + routeNumber + "' already exists");
        }

        TransportRoute route = TransportRoute.builder()
                .school(school)
                .routeName(request.getRouteName().trim())
                .routeNumber(routeNumber)
                .startPoint(request.getStartPoint())
                .endPoint(request.getEndPoint())
                .monthlyFee(request.getMonthlyFee())
                .incharge(resolveIncharge(schoolId, request.getInchargeTeacherId()))
                .active(true)
                .build();

        applyStops(route, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Route created", toResponse(routeRepository.save(route))));
    }

    @PutMapping("/routes/{id}")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Transactional
    @Operation(summary = "Update a transport route")
    public ResponseEntity<ApiResponse<TransportRouteResponse>> updateRoute(
            @PathVariable Long id,
            @Valid @RequestBody TransportRouteRequest request) {

        Long schoolId = TenantContext.getCurrentSchoolId();
        TransportRoute route = routeRepository.findById(id)
                .filter(r -> r.getSchool().getId().equals(schoolId) && !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Route", id));

        String routeNumber = request.getRouteNumber().trim();
        if (!routeNumber.equalsIgnoreCase(route.getRouteNumber())
                && routeRepository.existsBySchoolIdAndRouteNumberAndDeletedFalse(schoolId, routeNumber)) {
            throw new BusinessException("Route number '" + routeNumber + "' already exists");
        }

        route.setRouteName(request.getRouteName().trim());
        route.setRouteNumber(routeNumber);
        route.setStartPoint(request.getStartPoint());
        route.setEndPoint(request.getEndPoint());
        route.setMonthlyFee(request.getMonthlyFee());
        route.setIncharge(resolveIncharge(schoolId, request.getInchargeTeacherId()));

        route.getStops().clear();   // orphanRemoval deletes the old stops
        applyStops(route, request);

        return ResponseEntity.ok(ApiResponse.success("Route updated", toResponse(routeRepository.save(route))));
    }

    @DeleteMapping("/routes/{id}")
    @PreAuthorize("hasAnyRole('TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Transactional
    @Operation(summary = "Delete a transport route")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long id) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        TransportRoute route = routeRepository.findById(id)
                .filter(r -> r.getSchool().getId().equals(schoolId) && !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Route", id));
        route.setDeleted(true);
        route.setActive(false);
        routeRepository.save(route);
        return ResponseEntity.ok(ApiResponse.success("Route deleted", null));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Teacher resolveIncharge(Long schoolId, Long inchargeTeacherId) {
        if (inchargeTeacherId == null) return null;
        Teacher teacher = teacherRepository.findById(inchargeTeacherId)
                .filter(t -> t.getSchool().getId().equals(schoolId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", inchargeTeacherId));
        return teacher;
    }

    private void applyStops(TransportRoute route, TransportRouteRequest request) {
        if (request.getStops() == null) return;
        int order = 1;
        for (TransportRouteRequest.StopEntry s : request.getStops()) {
            if (s == null || s.getStopName() == null || s.getStopName().isBlank()) continue;
            route.getStops().add(TransportRouteStop.builder()
                    .route(route)
                    .stopName(s.getStopName().trim())
                    .pickupTime(s.getPickupTime())
                    .seqOrder(order++)
                    .build());
        }
    }

    private TransportRouteResponse toResponse(TransportRoute r) {
        Teacher incharge = r.getIncharge();
        String inchargeName = null;
        if (incharge != null && incharge.getUser() != null) {
            User u = incharge.getUser();
            inchargeName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " "
                    + (u.getLastName() == null ? "" : u.getLastName())).trim();
        }

        List<TransportRouteResponse.StopInfo> stops = new ArrayList<>();
        if (r.getStops() != null) {
            r.getStops().forEach(s -> stops.add(TransportRouteResponse.StopInfo.builder()
                    .id(s.getId())
                    .stopName(s.getStopName())
                    .pickupTime(s.getPickupTime())
                    .seqOrder(s.getSeqOrder())
                    .build()));
        }

        return TransportRouteResponse.builder()
                .id(r.getId())
                .routeName(r.getRouteName())
                .routeNumber(r.getRouteNumber())
                .startPoint(r.getStartPoint())
                .endPoint(r.getEndPoint())
                .monthlyFee(r.getMonthlyFee())
                .active(r.isActive())
                .inchargeTeacherId(incharge != null ? incharge.getId() : null)
                .inchargeName(inchargeName)
                .stops(stops)
                .build();
    }
}
