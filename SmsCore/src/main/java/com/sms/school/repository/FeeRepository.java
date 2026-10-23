package com.sms.school.repository;

import com.sms.school.entity.Fee;
import com.sms.school.entity.enums.FeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {

    List<Fee> findByStudentIdAndDeletedFalse(Long studentId);

    List<Fee> findByStudentIdAndAcademicYearAndDeletedFalse(Long studentId, String academicYear);

    List<Fee> findBySchoolIdAndStudentIdAndAcademicYearAndDeletedFalse(
            Long schoolId, Long studentId, String academicYear);

    List<Fee> findBySchoolIdAndStatusAndDeletedFalse(Long schoolId, FeeStatus status);

    List<Fee> findBySchoolIdAndDeletedFalse(Long schoolId);

    List<Fee> findBySchoolIdAndAcademicYearAndDeletedFalse(Long schoolId, String academicYear);

    /** Count of pending/overdue/partial fees for a school — admin dashboard */
    long countBySchoolIdAndStatusInAndDeletedFalse(Long schoolId, java.util.Collection<FeeStatus> statuses);

    /** Sum of pending fees for a single student */
    @Query("""
            SELECT COALESCE(SUM(f.amount - COALESCE(f.discount, 0) + COALESCE(f.fine, 0)), 0)
            FROM Fee f
            WHERE f.student.id = :studentId
              AND f.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
              AND f.deleted = false
            """)
    BigDecimal sumPendingByStudentId(Long studentId);

    /** Sum of all outstanding fees for a whole school — admin dashboard */
    @Query("""
            SELECT COALESCE(SUM(f.amount - COALESCE(f.discount, 0) + COALESCE(f.fine, 0)), 0)
            FROM Fee f
            WHERE f.school.id = :schoolId
              AND f.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
              AND f.deleted = false
            """)
    BigDecimal sumPendingFeesBySchoolId(Long schoolId);
}
