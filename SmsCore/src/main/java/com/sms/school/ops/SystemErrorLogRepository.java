package com.sms.school.ops;

import com.sms.school.ops.entity.SystemErrorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SystemErrorLogRepository extends JpaRepository<SystemErrorLog, Long> {

    /** Recent open duplicate (same fingerprint) to group into. */
    Optional<SystemErrorLog> findFirstByFingerprintAndStatusNotAndCreatedAtAfterOrderByCreatedAtDesc(
            String fingerprint, String status, LocalDateTime after);

    @Query("""
            SELECT e FROM SystemErrorLog e
            WHERE e.deleted = false
              AND (:schoolId IS NULL OR e.schoolId = :schoolId)
              AND (:service  IS NULL OR e.service = :service)
              AND (:severity IS NULL OR e.severity = :severity)
              AND (:status   IS NULL OR e.status = :status)
              AND e.createdAt >= :from
            ORDER BY e.createdAt DESC
            """)
    Page<SystemErrorLog> search(@Param("schoolId") Long schoolId,
                                @Param("service") String service,
                                @Param("severity") String severity,
                                @Param("status") String status,
                                @Param("from") LocalDateTime from,
                                Pageable pageable);

    long countByCreatedAtAfterAndDeletedFalse(LocalDateTime from);
    long countBySeverityAndCreatedAtAfterAndDeletedFalse(String severity, LocalDateTime from);
    long countByStatusAndDeletedFalse(String status);

    @Query("SELECT COUNT(DISTINCT e.schoolId) FROM SystemErrorLog e WHERE e.deleted = false AND e.schoolId IS NOT NULL AND e.createdAt >= :from")
    long countDistinctSchools(@Param("from") LocalDateTime from);

    @Query("SELECT DISTINCT e.service FROM SystemErrorLog e WHERE e.deleted = false ORDER BY e.service")
    List<String> distinctServices();
}
