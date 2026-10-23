package com.sms.school.repository;

import com.sms.school.entity.School;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {

    Optional<School> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByEmail(String email);

    // ── Tenant listing (Super Admin) ───────────────────────────────────────────

    @Query(value = """
        SELECT s FROM School s
        WHERE s.deleted = false
        AND (:status IS NULL OR s.status = :status)
        AND (:search IS NULL
             OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))
             OR s.phone LIKE CONCAT('%', :search, '%')
             OR s.mobile LIKE CONCAT('%', :search, '%'))
        """,
        countQuery = """
        SELECT COUNT(s) FROM School s
        WHERE s.deleted = false
        AND (:status IS NULL OR s.status = :status)
        AND (:search IS NULL
             OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(s.code) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))
             OR s.phone LIKE CONCAT('%', :search, '%')
             OR s.mobile LIKE CONCAT('%', :search, '%'))
        """)
    Page<School> findAllByFilter(@Param("status") String status,
                                  @Param("search") String search,
                                  Pageable pageable);

    // ── Tenant status (used by TenantStatusChecker cache) ─────────────────────

    @Query("SELECT s.status FROM School s WHERE s.id = :id AND s.deleted = false")
    Optional<String> findStatusById(@Param("id") Long id);

    // ── Tenant stats (Super Admin dashboard) ──────────────────────────────────

    @Query("SELECT COUNT(s) FROM School s WHERE s.deleted = false AND s.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(s) FROM School s WHERE s.deleted = false")
    long countAll();

    // ── Quick lookup by code for public branding endpoint ─────────────────────

    @Query("""
        SELECT s FROM School s
        LEFT JOIN FETCH s.subscriptionPlan
        WHERE UPPER(s.code) = UPPER(:code) AND s.deleted = false
        """)
    Optional<School> findByCodeWithPlan(@Param("code") String code);
}
