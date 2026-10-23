package com.sms.school.service.template.impl;

import com.sms.school.entity.School;
import com.sms.school.entity.TenantRole;
import com.sms.school.entity.TenantRolePermission;
import com.sms.school.entity.enums.InstitutionType;
import com.sms.school.entity.template.*;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.TenantRoleRepository;
import com.sms.school.repository.template.InstitutionTemplateRepository;
import com.sms.school.repository.template.TenantTemplateRepository;
import com.sms.school.service.template.TemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateServiceImpl implements TemplateService {

    private final InstitutionTemplateRepository templateRepo;
    private final TenantTemplateRepository tenantTemplateRepo;
    private final SchoolRepository schoolRepo;
    private final TenantRoleRepository tenantRoleRepo;

    @Override
    @Transactional
    public TenantTemplate applyTemplate(Long tenantId, InstitutionType institutionType, String appliedBy) {
        if (tenantTemplateRepo.existsByTenantId(tenantId)) {
            log.info("Template already applied for tenantId={}, returning existing", tenantId);
            return tenantTemplateRepo.findByTenantId(tenantId).orElseThrow();
        }

        School tenant = schoolRepo.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));

        InstitutionTemplate template = templateRepo.findFullTemplateByType(institutionType)
                .orElseThrow(() -> new ResourceNotFoundException("No active template for: " + institutionType));

        AtomicInteger rolesCreated = new AtomicInteger(0);
        AtomicInteger permsCreated = new AtomicInteger(0);

        try {
            for (TemplateRole tr : template.getRoles()) {
                if (tenantRoleRepo.existsByTenantIdAndRoleName(tenantId, tr.getRoleName())) continue;

                List<TenantRolePermission> perms = new ArrayList<>();
                TenantRole tenantRole = TenantRole.builder()
                        .tenant(tenant)
                        .roleName(tr.getRoleName())
                        .displayName(tr.getDisplayName())
                        .description(tr.getDescription())
                        .systemRole(tr.isSystemRole())
                        .sortOrder(tr.getSortOrder())
                        .build();

                for (TemplatePermission tp : tr.getPermissions()) {
                    perms.add(TenantRolePermission.builder()
                            .tenant(tenant)
                            .tenantRole(tenantRole)
                            .resource(tp.getResource())
                            .action(tp.getAction())
                            .build());
                    permsCreated.incrementAndGet();
                }
                tenantRole.setPermissions(perms);
                tenantRoleRepo.save(tenantRole);
                rolesCreated.incrementAndGet();
            }

            TenantTemplate tenantTemplate = TenantTemplate.builder()
                    .tenant(tenant)
                    .template(template)
                    .appliedBy(appliedBy)
                    .status("APPLIED")
                    .build();
            tenantTemplateRepo.save(tenantTemplate);

            log.info("Template applied: tenant={} type={} roles={} perms={}",
                    tenantId, institutionType, rolesCreated.get(), permsCreated.get());
            return tenantTemplate;

        } catch (Exception e) {
            log.error("Template application failed for tenant={}", tenantId, e);
            TenantTemplate failed = TenantTemplate.builder()
                    .tenant(tenant).template(template)
                    .appliedBy(appliedBy).status("FAILED").errorLog(e.getMessage()).build();
            tenantTemplateRepo.save(failed);
            throw e;
        }
    }

    @Override
    public InstitutionTemplate getTemplate(InstitutionType type) {
        return templateRepo.findFullTemplateByType(type)
                .orElseThrow(() -> new ResourceNotFoundException("No template for type: " + type));
    }

    @Override
    public TenantTemplate getTenantTemplate(Long tenantId) {
        return tenantTemplateRepo.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("No template applied for tenant: " + tenantId));
    }
}
