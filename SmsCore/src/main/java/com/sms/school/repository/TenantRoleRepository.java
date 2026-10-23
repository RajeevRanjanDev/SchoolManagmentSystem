package com.sms.school.repository;

import com.sms.school.entity.TenantRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TenantRoleRepository extends JpaRepository<TenantRole, Long> {
    List<TenantRole> findByTenantIdAndDeletedFalse(Long tenantId);
    boolean existsByTenantIdAndRoleName(Long tenantId, String roleName);
}
