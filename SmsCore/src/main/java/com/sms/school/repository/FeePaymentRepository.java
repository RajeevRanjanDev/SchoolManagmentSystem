package com.sms.school.repository;

import com.sms.school.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {

    List<FeePayment> findByFeeIdAndDeletedFalse(Long feeId);

    List<FeePayment> findByFeeStudentIdAndDeletedFalse(Long studentId);

    /** Sum of payments received by a school from a given date — used by admin dashboard */
    @Query("""
            SELECT COALESCE(SUM(fp.amountPaid), 0)
            FROM FeePayment fp
            WHERE fp.school.id      = :schoolId
              AND fp.paymentDate   >= :startDate
              AND fp.deleted        = false
            """)
    BigDecimal sumCollectedSince(Long schoolId, LocalDateTime startDate);
}
