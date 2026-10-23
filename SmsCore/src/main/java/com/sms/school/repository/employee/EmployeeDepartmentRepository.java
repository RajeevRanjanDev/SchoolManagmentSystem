package com.sms.school.repository.employee;

import com.sms.school.entity.employee.EmployeeDepartment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeDepartmentRepository extends JpaRepository<EmployeeDepartment, Long> {
    List<EmployeeDepartment> findByTenantIdAndDeletedFalse(Long tenantId);
    Optional<EmployeeDepartment> findByTenantIdAndCodeAndDeletedFalse(Long tenantId, String code);
    boolean existsByTenantIdAndCode(Long tenantId, String code);
}
