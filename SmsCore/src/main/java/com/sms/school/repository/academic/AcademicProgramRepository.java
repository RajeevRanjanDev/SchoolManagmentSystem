package com.sms.school.repository.academic;

import com.sms.school.entity.academic.AcademicProgram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicProgramRepository extends JpaRepository<AcademicProgram, Long> {
    List<AcademicProgram> findByTenantIdAndActiveAndDeletedFalse(Long tenantId, boolean active);
    Optional<AcademicProgram> findByTenantIdAndCodeAndDeletedFalse(Long tenantId, String code);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
