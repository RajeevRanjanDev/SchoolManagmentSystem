package com.sms.school.repository;

import com.sms.school.entity.StudentParentMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentParentMappingRepository extends JpaRepository<StudentParentMapping, Long> {

    /** All non-deleted mappings for a given student */
    List<StudentParentMapping> findBySchoolIdAndStudentIdAndDeletedFalse(Long schoolId, Long studentId);

    /** All non-deleted mappings for a given parent (all their children) */
    List<StudentParentMapping> findBySchoolIdAndParentIdAndDeletedFalse(Long schoolId, Long parentId);

    /** Check if a parent is already linked to a student */
    boolean existsBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(
            Long schoolId, Long studentId, Long parentId);

    /** Find a specific student-parent link */
    Optional<StudentParentMapping> findBySchoolIdAndStudentIdAndParentIdAndDeletedFalse(
            Long schoolId, Long studentId, Long parentId);

    /**
     * Find the Parent record whose user login = userId.
     * Used in ParentDashboardController to resolve the parent from JWT userId.
     */
    @Query("""
            SELECT spm FROM StudentParentMapping spm
            WHERE spm.school.id        = :schoolId
              AND spm.parent.user.id   = :userId
              AND spm.deleted          = false
            """)
    List<StudentParentMapping> findBySchoolIdAndParentUserIdAndDeletedFalse(
            Long schoolId, Long userId);
}
