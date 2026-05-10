package com.sms.school.repository;

import com.sms.school.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {

    List<FeePayment> findByFeeIdAndDeletedFalse(Long feeId);

    List<FeePayment> findByFeeStudentIdAndDeletedFalse(Long studentId);
}
