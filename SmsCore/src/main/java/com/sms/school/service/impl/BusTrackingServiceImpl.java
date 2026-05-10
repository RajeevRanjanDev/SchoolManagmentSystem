package com.sms.school.service.impl;

import com.sms.school.dto.request.UpdateBusLocationRequest;
import com.sms.school.dto.response.BusLocationResponse;
import com.sms.school.entity.BusTrackingLog;
import com.sms.school.entity.School;
import com.sms.school.entity.TransportVehicle;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.BusTrackingLogRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.TransportVehicleRepository;
import com.sms.school.service.BusTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BusTrackingServiceImpl implements BusTrackingService {

    private final BusTrackingLogRepository busTrackingLogRepository;
    private final TransportVehicleRepository vehicleRepository;
    private final SchoolRepository schoolRepository;
    private final SimpMessagingTemplate messagingTemplate;  // WebSocket broadcast

    @Override
    @Transactional
    public BusLocationResponse updateLocation(Long schoolId, UpdateBusLocationRequest request) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        TransportVehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));

        BusTrackingLog log = BusTrackingLog.builder()
                .school(school)
                .vehicle(vehicle)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .speedKmh(request.getSpeedKmh())
                .recordedAt(LocalDateTime.now())
                .build();
        busTrackingLogRepository.save(log);

        BusLocationResponse locationResponse = toResponse(vehicle, log);

        // Broadcast over WebSocket – parents subscribed to /topic/bus/{vehicleId} get this
        messagingTemplate.convertAndSend(
                "/topic/bus/" + vehicle.getId(), locationResponse);

        return locationResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public BusLocationResponse getLiveLocation(Long schoolId, Long vehicleId) {
        TransportVehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));

        BusTrackingLog latest = busTrackingLogRepository
                .findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No location data available for vehicle " + vehicleId));

        return toResponse(vehicle, latest);
    }

    // ── Private helpers ───────────────────────────────────────────────

    private BusLocationResponse toResponse(TransportVehicle v, BusTrackingLog l) {
        return BusLocationResponse.builder()
                .vehicleId(v.getId())
                .vehicleNumber(v.getVehicleNumber())
                .latitude(l.getLatitude())
                .longitude(l.getLongitude())
                .speedKmh(l.getSpeedKmh())
                .recordedAt(l.getRecordedAt())
                .driverName(v.getDriverName())
                .driverPhone(v.getDriverPhone())
                .build();
    }
}
