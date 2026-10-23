package com.sms.school.repository;

import com.sms.school.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findBySchoolIdAndAdmissionNumber(Long schoolId, String admissionNumber);

    Page<Student> findBySchoolIdAndDeletedFalse(Long schoolId, Pageable pageable);

    List<Student> findByParentIdAndDeletedFalse(Long parentId);

    /** Students enrolled in a specific section (via mapping table) */
    @Query("""
            SELECT s FROM Student s
            JOIN StudentClassMapping m ON m.student = s
            WHERE m.section.id = :sectionId
              AND m.current = true
              AND s.deleted = false
            """)
    List<Student> findBySectionId(Long sectionId);

    boolean existsBySchoolIdAndAdmissionNumber(Long schoolId, String admissionNumber);

    /** Count students currently enrolled in a section (via mapping table) */
    @Query("""
            SELECT COUNT(s) FROM Student s
            JOIN StudentClassMapping m ON m.student = s
            WHERE m.section.id = :sectionId
              AND m.current = true
              AND s.deleted = false
            """)
    long countBySectionId(Long sectionId);

    // ── Platform-level stats (SUPER_ADMIN) ────────────────────────────────────

    long countBySchoolIdAndDeletedFalse(Long schoolId);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.deleted = false")
    long countAll();
}
