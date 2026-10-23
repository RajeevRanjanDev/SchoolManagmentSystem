package com.sms.school.repository.template;

import com.sms.school.entity.template.TenantTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantTemplateRepository extends JpaRepository<TenantTemplate, Long> {
    Optional<TenantTemplate> findByTenantId(Long tenantId);
    boolean existsByTenantId(Long tenantId);
}
