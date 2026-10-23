package com.sms.school.repository.academic;

import com.sms.school.entity.academic.AcademicBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicBatchRepository extends JpaRepository<AcademicBatch, Long> {
    List<AcademicBatch> findByTenantIdAndActiveAndDeletedFalse(Long tenantId, boolean active);
    Optional<AcademicBatch> findByTenantIdAndCodeAndDeletedFalse(Long tenantId, String code);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
