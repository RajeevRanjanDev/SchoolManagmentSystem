package com.sms.school.payment.repository;

import com.sms.school.payment.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Container for the payment/reconciliation repository interfaces. */
public final class PaymentRepositories {
    private PaymentRepositories() {}

    public interface GatewayAccountRepo extends JpaRepository<SchoolPaymentGatewayAccount, Long> {
        Optional<SchoolPaymentGatewayAccount> findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(Long schoolId, String mode);
        List<SchoolPaymentGatewayAccount> findBySchoolIdAndDeletedFalse(Long schoolId);
    }

    public interface AttemptRepo extends JpaRepository<PaymentAttempt, Long> {
        Optional<PaymentAttempt> findByRazorpayOrderId(String orderId);
        Optional<PaymentAttempt> findByIdempotencyKey(String key);
        List<PaymentAttempt> findBySchoolIdAndStudentIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId, Long studentId);
        List<PaymentAttempt> findByStatusInAndDeletedFalse(List<String> statuses);
    }

    public interface TransactionRepo extends JpaRepository<PaymentTransaction, Long> {
        Optional<PaymentTransaction> findByRazorpayPaymentId(String paymentId);
        List<PaymentTransaction> findByPaymentAttemptId(Long attemptId);
        List<PaymentTransaction> findBySchoolIdAndStatusAndAllocatedFalseAndDeletedFalse(Long schoolId, String status);
        Page<PaymentTransaction> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId, Pageable pageable);
        List<PaymentTransaction> findBySchoolIdAndStatusAndCapturedAtBetweenAndDeletedFalse(
                Long schoolId, String status, LocalDateTime from, LocalDateTime to);
        List<PaymentTransaction> findBySchoolIdAndStatusAndDeletedFalse(Long schoolId, String status);
        long countByStatusAndCreatedAtAfterAndDeletedFalse(String status, LocalDateTime from);
    }

    public interface AllocationRepo extends JpaRepository<PaymentAllocation, Long> {
        List<PaymentAllocation> findByPaymentTransactionId(Long txnId);
        List<PaymentAllocation> findByFeeId(Long feeId);
        boolean existsByPaymentTransactionIdAndFeeId(Long txnId, Long feeId);
    }

    public interface RefundRepo extends JpaRepository<PaymentRefund, Long> {
        List<PaymentRefund> findByPaymentTransactionId(Long txnId);
        List<PaymentRefund> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId);
    }

    public interface WebhookEventRepo extends JpaRepository<GatewayWebhookEvent, Long> {
        Optional<GatewayWebhookEvent> findByEventId(String eventId);
        List<GatewayWebhookEvent> findByProcessingStatusAndDeletedFalse(String status);
    }

    public interface SettlementRepo extends JpaRepository<GatewaySettlement, Long> {
        Optional<GatewaySettlement> findBySchoolIdAndRazorpaySettlementId(Long schoolId, String settlementId);
        List<GatewaySettlement> findBySchoolIdAndDeletedFalseOrderBySettledOnDesc(Long schoolId);
    }

    public interface ReconRunRepo extends JpaRepository<ReconciliationRun, Long> {
        List<ReconciliationRun> findBySchoolIdAndDeletedFalseOrderByStartedAtDesc(Long schoolId);
    }

    public interface ReconExceptionRepo extends JpaRepository<ReconciliationException, Long> {
        List<ReconciliationException> findBySchoolIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(Long schoolId, String status);
        List<ReconciliationException> findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(Long schoolId);
        long countBySchoolIdAndStatusAndDeletedFalse(Long schoolId, String status);
        boolean existsByExceptionTypeAndReferenceIdAndStatusAndDeletedFalse(String type, Long refId, String status);
    }
}
