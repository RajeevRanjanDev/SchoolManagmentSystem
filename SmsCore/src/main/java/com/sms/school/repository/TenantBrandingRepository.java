package com.sms.school.repository;

import com.sms.school.entity.TenantBranding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantBrandingRepository extends JpaRepository<TenantBranding, Long> {

    Optional<TenantBranding> findBySchoolId(Long schoolId);

    boolean existsBySchoolId(Long schoolId);
}
