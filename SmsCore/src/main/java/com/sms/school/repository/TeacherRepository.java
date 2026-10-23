package com.sms.school.repository;

import com.sms.school.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByUserId(Long userId);

    Optional<Teacher> findByUserEmail(String email);

    Page<Teacher> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);

    List<Teacher> findBySchoolIdAndDeletedFalse(Long schoolId);

    List<Teacher> findBySchoolIdAndStatusAndDeletedFalse(Long schoolId, String status);

    Optional<Teacher> findBySchoolIdAndUserIdAndDeletedFalse(Long schoolId, Long userId);

    Optional<Teacher> findBySchoolIdAndEmployeeCodeAndDeletedFalse(Long schoolId, String employeeCode);

    boolean existsBySchoolIdAndEmployeeCodeAndDeletedFalse(Long schoolId, String employeeCode);

    /** Find teacher by JWT userId — used in TeacherDashboardService. */
    @Query("SELECT t FROM Teacher t WHERE t.school.id = :schoolId AND t.user.id = :userId AND t.deleted = false")
    Optional<Teacher> findActiveBySchoolAndUser(@org.springframework.data.repository.query.Param("schoolId") Long schoolId,
                                                @org.springframework.data.repository.query.Param("userId") Long userId);

    // ── Platform-level stats (SUPER_ADMIN) ────────────────────────────────────

    long countBySchoolIdAndDeletedFalse(Long schoolId);

    @Query("SELECT COUNT(t) FROM Teacher t WHERE t.deleted = false")
    long countAll();
}
