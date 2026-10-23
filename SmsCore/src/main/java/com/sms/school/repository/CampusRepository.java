package com.sms.school.repository;

import com.sms.school.entity.Campus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampusRepository extends JpaRepository<Campus, Long> {
    List<Campus> findByTenantIdAndDeletedFalse(Long tenantId);
    List<Campus> findByTenantIdAndActiveAndDeletedFalse(Long tenantId, boolean active);
    Optional<Campus> findByTenantIdAndCodeAndDeletedFalse(Long tenantId, String code);
    Optional<Campus> findByTenantIdAndMainCampusTrueAndDeletedFalse(Long tenantId);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
    long countByTenantIdAndDeletedFalse(Long tenantId);
}
