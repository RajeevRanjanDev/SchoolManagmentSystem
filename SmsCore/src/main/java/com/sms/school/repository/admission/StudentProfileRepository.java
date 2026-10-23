package com.sms.school.repository.admission;

import com.sms.school.entity.admission.StudentProfile;
import com.sms.school.entity.enums.StudentLifecycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    boolean existsByTenantIdAndAdmissionNumber(Long tenantId, String admissionNumber);
    boolean existsByTenantIdAndAadhaarNumber(Long tenantId, String aadhaarNumber);

    Optional<StudentProfile> findByIdAndTenantIdAndDeletedFalse(Long id, Long tenantId);

    /** The profile owned by a student login account. */
    Optional<StudentProfile> findByUserIdAndDeletedFalse(Long userId);
    Optional<StudentProfile> findByTenantIdAndAdmissionNumberAndDeletedFalse(Long tenantId, String admissionNumber);
    Optional<StudentProfile> findByTenantIdAndStudentCodeAndDeletedFalse(Long tenantId, String studentCode);

    Page<StudentProfile> findByTenantIdAndDeletedFalse(Long tenantId, Pageable pageable);

    Page<StudentProfile> findByTenantIdAndLifecycleStatusAndDeletedFalse(
            Long tenantId, StudentLifecycleStatus status, Pageable pageable);

    @Query("""
            SELECT s FROM StudentProfile s
            WHERE s.tenantId = :tenantId
              AND s.deleted = false
              AND (
                LOWER(s.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
                OR LOWER(s.lastName) LIKE LOWER(CONCAT('%',:q,'%'))
                OR s.admissionNumber LIKE CONCAT('%',:q,'%')
                OR s.mobile LIKE CONCAT('%',:q,'%')
              )
            """)
    Page<StudentProfile> search(@Param("tenantId") Long tenantId,
                                @Param("q") String query,
                                Pageable pageable);

    long countByTenantIdAndLifecycleStatusAndDeletedFalse(Long tenantId, StudentLifecycleStatus status);

    long countByTenantIdAndDeletedFalse(Long tenantId);

    /**
     * Unified filter: optional lifecycle status, class, section and free-text search.
     * LEFT JOIN so students without an academic profile still appear when not filtering by class/section.
     */
    @Query("""
            SELECT s FROM StudentProfile s
            LEFT JOIN s.academicProfile ap
            WHERE s.tenantId = :tenantId AND s.deleted = false
              AND (:hasStatus = false OR s.lifecycleStatus IN :statuses)
              AND (:classId IS NULL OR ap.classId = :classId)
              AND (:sectionId IS NULL OR ap.sectionId = :sectionId)
              AND (
                    LOWER(s.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR LOWER(s.lastName)  LIKE LOWER(CONCAT('%', :q, '%'))
                 OR s.admissionNumber  LIKE CONCAT('%', :q, '%')
                 OR COALESCE(s.mobile, '') LIKE CONCAT('%', :q, '%'))
            """)
    Page<StudentProfile> filter(@Param("tenantId") Long tenantId,
                                @Param("hasStatus") boolean hasStatus,
                                @Param("statuses") java.util.List<StudentLifecycleStatus> statuses,
                                @Param("classId") Long classId,
                                @Param("sectionId") Long sectionId,
                                @Param("q") String q,
                                Pageable pageable);
}
