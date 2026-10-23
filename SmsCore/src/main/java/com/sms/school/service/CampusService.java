package com.sms.school.service;

import com.sms.school.dto.request.CreateCampusRequest;
import com.sms.school.dto.response.CampusResponse;
import com.sms.school.entity.Campus;
import com.sms.school.entity.CampusTransferLog;
import com.sms.school.exception.BadRequestException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.CampusRepository;
import com.sms.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampusService {

    private final CampusRepository campusRepo;
    private final SchoolRepository schoolRepo;

    @Transactional
    public CampusResponse create(Long tenantId, CreateCampusRequest req, String createdBy) {
        if (campusRepo.existsByTenantIdAndCode(tenantId, req.getCode()))
            throw new BadRequestException("Campus code '" + req.getCode() + "' already exists in this institution");

        var tenant = schoolRepo.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        boolean isFirst = campusRepo.countByTenantIdAndDeletedFalse(tenantId) == 0;

        Campus campus = Campus.builder()
                .tenant(tenant)
                .name(req.getName())
                .code(req.getCode())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .email(req.getEmail())
                .principalName(req.getPrincipalName())
                .institutionType(req.getInstitutionType())
                .mainCampus(isFirst || Boolean.TRUE.equals(req.getMainCampus()))
                .currentAcademicYear(tenant.getCurrentAcademicYear())
                .build();

        campus = campusRepo.save(campus);
        return toResponse(campus);
    }

    @Transactional(readOnly = true)
    public List<CampusResponse> listAll(Long tenantId) {
        return campusRepo.findByTenantIdAndDeletedFalse(tenantId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CampusResponse getById(Long tenantId, Long campusId) {
        Campus c = campusRepo.findById(campusId)
                .filter(campus -> campus.getTenant().getId().equals(tenantId) && !campus.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Campus not found: " + campusId));
        return toResponse(c);
    }

    @Transactional
    public void deactivate(Long tenantId, Long campusId) {
        Campus c = campusRepo.findById(campusId)
                .filter(campus -> campus.getTenant().getId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Campus not found"));
        if (c.isMainCampus())
            throw new BadRequestException("Cannot deactivate the main campus");
        c.setActive(false);
        campusRepo.save(c);
    }

    private CampusResponse toResponse(Campus c) {
        return CampusResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .code(c.getCode())
                .city(c.getCity())
                .state(c.getState())
                .phone(c.getPhone())
                .email(c.getEmail())
                .principalName(c.getPrincipalName())
                .mainCampus(c.isMainCampus())
                .active(c.isActive())
                .institutionType(c.getInstitutionType() != null ? c.getInstitutionType().name() : null)
                .currentAcademicYear(c.getCurrentAcademicYear())
                .build();
    }
}
