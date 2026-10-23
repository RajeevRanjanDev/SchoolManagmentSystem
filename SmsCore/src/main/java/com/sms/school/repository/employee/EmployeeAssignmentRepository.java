package com.sms.school.repository.employee;

import com.sms.school.entity.employee.EmployeeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmployeeAssignmentRepository extends JpaRepository<EmployeeAssignment, Long> {

    List<EmployeeAssignment> findByEmployeeIdAndDeletedFalse(Long employeeId);

    List<EmployeeAssignment> findByTenantIdAndSchoolClassIdAndDeletedFalse(Long tenantId, Long classId);

    @Query("SELECT a FROM EmployeeAssignment a WHERE a.tenant.id = :tenantId AND a.batch.id = :batchId AND a.deleted = false")
    List<EmployeeAssignment> findByBatch(@Param("tenantId") Long tenantId, @Param("batchId") Long batchId);

    @Query("SELECT a FROM EmployeeAssignment a WHERE a.tenant.id = :tenantId AND a.program.id = :programId AND a.semester.id = :semesterId AND a.deleted = false")
    List<EmployeeAssignment> findByProgramSemester(@Param("tenantId") Long tenantId,
                                                    @Param("programId") Long programId,
                                                    @Param("semesterId") Long semesterId);
}
