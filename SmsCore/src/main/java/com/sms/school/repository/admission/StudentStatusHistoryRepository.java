package com.sms.school.repository.admission;

import com.sms.school.entity.admission.StudentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentStatusHistoryRepository extends JpaRepository<StudentStatusHistory, Long> {

    List<StudentStatusHistory> findByStudentProfileIdOrderByCreatedAtDesc(Long studentProfileId);

    java.util.List<com.sms.school.entity.admission.StudentStatusHistory> findByStudentProfileIdAndTenantIdOrderByCreatedAtDesc(Long studentProfileId, Long tenantId);
}
