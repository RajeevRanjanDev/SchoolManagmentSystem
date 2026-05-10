package com.sms.school.repository;

import com.sms.school.entity.Fee;
import com.sms.school.entity.enums.FeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {

    List<Fee> findByStudentIdAndDeletedFalse(Long studentId);

    List<Fee> findByStudentIdAndAcademicYearAndDeletedFalse(Long studentId, String academicYear);

    List<Fee> findBySchoolIdAndStatusAndDeletedFalse(Long schoolId, FeeStatus status);

    /** Sum of pending fees for a student */
    @Query("""
            SELECT COALESCE(SUM(f.amount - COALESCE(f.discount, 0) + COALESCE(f.fine, 0)), 0)
            FROM Fee f
            WHERE f.student.id = :studentId
              AND f.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
              AND f.deleted = false
            """)
    java.math.BigDecimal sumPendingByStudentId(Long studentId);
}
