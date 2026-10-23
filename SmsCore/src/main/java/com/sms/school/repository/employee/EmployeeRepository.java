package com.sms.school.repository.employee;

import com.sms.school.entity.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByTenantIdAndEmployeeCode(Long tenantId, String code);
    boolean existsByTenantIdAndAadhaarNumber(Long tenantId, String aadhaar);
    boolean existsByTenantIdAndOfficialEmail(Long tenantId, String email);

    Optional<Employee> findByTenantIdAndEmployeeCodeAndDeletedFalse(Long tenantId, String code);
    Optional<Employee> findByTenantIdAndIdAndDeletedFalse(Long tenantId, Long id);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.tenant.id = :tenantId
          AND e.deleted = false
          AND (:status IS NULL OR e.employmentStatus = :status)
          AND (:search IS NULL OR LOWER(e.firstName) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(e.lastName) LIKE LOWER(CONCAT('%',:search,'%'))
               OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%',:search,'%')))
        """)
    Page<Employee> search(@Param("tenantId") Long tenantId,
                          @Param("status") String status,
                          @Param("search") String search,
                          Pageable pageable);

    long countByTenantIdAndEmploymentStatusAndDeletedFalse(Long tenantId, String status);
}
