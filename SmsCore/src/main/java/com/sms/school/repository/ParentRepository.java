package com.sms.school.repository;

import com.sms.school.entity.Parent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {

    Optional<Parent> findByUserId(Long userId);

    Optional<Parent> findByUserEmail(String email);

    Optional<Parent> findBySchoolIdAndUserIdAndDeletedFalse(Long schoolId, Long userId);

    Page<Parent> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);

    // ── Platform-level stats (SUPER_ADMIN) ────────────────────────────────────

    long countBySchoolIdAndDeletedFalse(Long schoolId);

    java.util.Optional<Parent> findBySchoolIdAndMobileAndDeletedFalse(Long schoolId, String mobile);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Parent p WHERE p.deleted = false")
    long countAll();
}
