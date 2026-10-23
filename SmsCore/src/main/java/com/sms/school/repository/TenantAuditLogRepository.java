package com.sms.school.repository;

import com.sms.school.entity.TenantAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantAuditLogRepository extends JpaRepository<TenantAuditLog, Long> {

    Page<TenantAuditLog> findBySchoolIdOrderByCreatedAtDesc(Long schoolId, Pageable pageable);

    Page<TenantAuditLog> findBySchoolIdIsNullOrderByCreatedAtDesc(Pageable pageable);
}
