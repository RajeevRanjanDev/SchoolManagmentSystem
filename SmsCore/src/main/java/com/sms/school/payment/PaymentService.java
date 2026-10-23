package com.sms.school.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.sms.school.entity.Fee;
import com.sms.school.entity.FeePayment;
import com.sms.school.entity.School;
import com.sms.school.entity.enums.FeeStatus;
import com.sms.school.entity.enums.PaymentMethod;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.payment.dto.PaymentDtos.*;
import com.sms.school.payment.entity.*;
import com.sms.school.payment.repository.PaymentRepositories.*;
import com.sms.school.repository.FeePaymentRepository;
import com.sms.school.repository.FeeRepository;
import com.sms.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Student self-pay flow: create order, verify, allocate to fees, receipts, history. */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final AttemptRepo attemptRepo;
    private final TransactionRepo txnRepo;
    private final AllocationRepo allocRepo;
    private final FeeRepository feeRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final SchoolRepository schoolRepository;
    private final GatewayAccountService gatewayAccounts;
    private final RazorpayClient razorpay;

    // ── Create order ─────────────────────────────────────────────────────────

    @Transactional
    public CreateOrderResponse createOrder(Long schoolId, Long studentId, Long userId,
                                           String studentName, String email, String contact,
                                           List<Long> feeIds) {
        if (feeIds == null || feeIds.isEmpty()) throw new BusinessException("Select at least one fee to pay.");

        List<Long> sortedIds = feeIds.stream().distinct().sorted().toList();
        long amountPaise = 0;
        for (Long feeId : sortedIds) {
            Fee fee = feeRepository.findById(feeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Fee", feeId));
            if (!fee.getSchool().getId().equals(schoolId) || fee.getStudent() == null
                    || !fee.getStudent().getId().equals(studentId)) {
                throw new BusinessException("One of the selected fees does not belong to this student.");
            }
            BigDecimal bal = balance(fee);
            if (bal.signum() <= 0) throw new BusinessException("A selected fee is already paid.");
            amountPaise += bal.movePointRight(2).longValueExact();
        }
        if (amountPaise <= 0) throw new BusinessException("Nothing outstanding to pay.");

        String idemKey = schoolId + ":" + studentId + ":" + sortedIds + ":" + amountPaise;

        // Reuse an in-flight attempt for the same fees+amount so a double click
        // never creates two Razorpay orders (and risks a double payment).
        PaymentAttempt attempt = attemptRepo.findByIdempotencyKey(idemKey)
                .filter(a -> List.of("CREATED", "PENDING").contains(a.getStatus()) && a.getRazorpayOrderId() != null)
                .orElse(null);

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));
        var account = gatewayAccounts.resolveActive(schoolId);

        if (attempt == null) {
            attempt = attemptRepo.save(PaymentAttempt.builder()
                    .schoolId(schoolId).studentId(studentId).initiatedByUserId(userId)
                    .gatewayAccountId(account.getId())
                    .feeIds(sortedIds.stream().map(String::valueOf).collect(Collectors.joining(",")))
                    .amountPaise(amountPaise).amount(BigDecimal.valueOf(amountPaise).movePointLeft(2))
                    .currency("INR").status("CREATED").idempotencyKey(idemKey)
                    .build());

            JsonNode order = razorpay.createOrder(account, amountPaise, "INR",
                    "attempt-" + attempt.getId(), Map.of("schoolId", schoolId, "studentId", studentId));
            String orderId = order.path("id").asText(null);
            if (orderId == null) throw new BusinessException("Could not create a payment order. Try again.");
            attempt.setRazorpayOrderId(orderId);
            attempt.setStatus("PENDING");
            attemptRepo.save(attempt);
        }

        return CreateOrderResponse.builder()
                .paymentAttemptId(attempt.getId())
                .razorpayOrderId(attempt.getRazorpayOrderId())
                .amount(attempt.getAmountPaise())
                .amountRupees(attempt.getAmount())
                .currency(attempt.getCurrency())
                .razorpayKeyId(account.getKeyId())
                .schoolName(school.getName())
                .studentName(studentName)
                .prefillEmail(email)
                .prefillContact(contact)
                .build();
    }

    // ── Verify (client callback) ─────────────────────────────────────────────

    @Transactional
    public PaymentView verify(Long schoolId, Long studentId, VerifyPaymentRequest req) {
        PaymentAttempt attempt = attemptRepo.findById(req.getPaymentAttemptId())
                .filter(a -> a.getSchoolId().equals(schoolId) && a.getStudentId().equals(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment attempt", req.getPaymentAttemptId()));
        if (!Objects.equals(attempt.getRazorpayOrderId(), req.getRazorpayOrderId())) {
            throw new BusinessException("Order mismatch. Please retry the payment.");
        }
        var account = gatewayAccounts.resolveActive(schoolId);
        if (!razorpay.verifyPaymentSignature(account, req.getRazorpayOrderId(),
                req.getRazorpayPaymentId(), req.getRazorpaySignature())) {
            throw new BusinessException("Payment signature verification failed.");
        }

        // Authoritative check: confirm the payment is actually captured + amounts match.
        JsonNode p = razorpay.fetchPayment(account, req.getRazorpayPaymentId());
        PaymentTransaction txn = recordTransaction(attempt, p);
        allocate(txn, attempt);
        return toView(txn, attempt.getStudentId());
    }

    /** Create/refresh the transaction from a gateway payment node. Idempotent on payment id. */
    @Transactional
    public PaymentTransaction recordTransaction(PaymentAttempt attempt, JsonNode p) {
        String paymentId = p.path("id").asText(null);
        String gatewayStatus = p.path("status").asText("");
        long amount = p.path("amount").asLong(0);
        long captured = p.path("amount_captured").asLong(p.path("captured").asBoolean(false) ? amount : 0);
        if (captured == 0 && "captured".equalsIgnoreCase(gatewayStatus)) captured = amount;

        PaymentTransaction txn = txnRepo.findByRazorpayPaymentId(paymentId).orElseGet(PaymentTransaction::new);
        txn.setSchoolId(attempt.getSchoolId());
        txn.setPaymentAttemptId(attempt.getId());
        txn.setStudentId(attempt.getStudentId());
        txn.setRazorpayOrderId(attempt.getRazorpayOrderId());
        txn.setRazorpayPaymentId(paymentId);
        txn.setMethod(p.path("method").asText(null));
        txn.setAmount(BigDecimal.valueOf(amount).movePointLeft(2));
        txn.setCapturedAmount(BigDecimal.valueOf(captured).movePointLeft(2));
        txn.setCurrency(p.path("currency").asText("INR"));
        txn.setGatewayStatus(gatewayStatus);
        // Never downgrade a captured transaction because of a stale 'failed' event.
        boolean isCaptured = "captured".equalsIgnoreCase(gatewayStatus) || captured > 0;
        if (isCaptured) {
            if (!"CAPTURED".equals(txn.getStatus())) txn.setStatus("CAPTURED");
            if (txn.getCapturedAt() == null) txn.setCapturedAt(LocalDateTime.now());
        } else if (txn.getStatus() == null || "CREATED".equals(txn.getStatus())) {
            txn.setStatus("authorized".equalsIgnoreCase(gatewayStatus) ? "AUTHORIZED"
                    : "failed".equalsIgnoreCase(gatewayStatus) ? "FAILED" : "CREATED");
        }
        txn = txnRepo.save(txn);

        if (isCaptured && captured < attempt.getAmountPaise()) {
            log.warn("Captured {} < expected {} for order {}", captured, attempt.getAmountPaise(), attempt.getRazorpayOrderId());
        }
        return txn;
    }

    // ── Allocation ───────────────────────────────────────────────────────────

    /** Allocate a captured transaction across the attempt's fees. Idempotent. */
    @Transactional
    public void allocate(PaymentTransaction txn, PaymentAttempt attempt) {
        if (!"CAPTURED".equals(txn.getStatus()) || txn.isAllocated()) return;

        BigDecimal remaining = txn.getCapturedAmount() != null ? txn.getCapturedAmount() : BigDecimal.ZERO;
        for (Long feeId : parseFeeIds(attempt.getFeeIds())) {
            if (remaining.signum() <= 0) break;
            if (allocRepo.existsByPaymentTransactionIdAndFeeId(txn.getId(), feeId)) continue;
            Fee fee = feeRepository.findById(feeId).orElse(null);
            if (fee == null) continue;
            BigDecimal bal = balance(fee);
            if (bal.signum() <= 0) continue;
            BigDecimal apply = bal.min(remaining);

            FeePayment fp = feePaymentRepository.save(FeePayment.builder()
                    .school(fee.getSchool()).fee(fee).amountPaid(apply)
                    .paymentDate(LocalDateTime.now()).paymentMethod(PaymentMethod.ONLINE)
                    .transactionReference(txn.getRazorpayPaymentId())
                    .receiptNumber("ON-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .remarks("Razorpay online payment " + txn.getRazorpayPaymentId())
                    .build());

            allocRepo.save(PaymentAllocation.builder()
                    .schoolId(txn.getSchoolId()).paymentTransactionId(txn.getId())
                    .feeId(feeId).studentId(txn.getStudentId()).feePaymentId(fp.getId())
                    .amount(apply).allocatedAt(LocalDateTime.now())
                    .build());

            BigDecimal paid = paidAmount(feeId);
            fee.setStatus(paid.compareTo(net(fee)) >= 0 ? FeeStatus.PAID : FeeStatus.PARTIAL);
            feeRepository.save(fee);
            remaining = remaining.subtract(apply);
        }

        txn.setAllocated(true);
        if (txn.getReceiptNumber() == null) {
            txn.setReceiptNumber("RZP-" + txn.getId() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            txn.setReceiptIssuedAt(LocalDateTime.now());
        }
        txnRepo.save(txn);

        attempt.setStatus("COMPLETED");
        attemptRepo.save(attempt);
    }

    // ── History / receipt ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PaymentView> history(Long schoolId, Long studentId) {
        return attemptRepo.findBySchoolIdAndStudentIdAndDeletedFalseOrderByCreatedAtDesc(schoolId, studentId).stream()
                .flatMap(a -> txnRepo.findByPaymentAttemptId(a.getId()).stream())
                .sorted(Comparator.comparing(PaymentTransaction::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(t -> toView(t, studentId))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReceiptView receipt(Long schoolId, Long txnId) {
        PaymentTransaction txn = txnRepo.findById(txnId)
                .filter(t -> t.getSchoolId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", txnId));
        List<ReceiptView.Line> lines = allocRepo.findByPaymentTransactionId(txnId).stream()
                .map(a -> {
                    Fee fee = feeRepository.findById(a.getFeeId()).orElse(null);
                    return ReceiptView.Line.builder()
                            .feeCategory(fee != null ? fee.getFeeCategory() : "Fee")
                            .feePeriod(fee != null ? fee.getFeePeriod() : null)
                            .amount(a.getAmount()).build();
                }).toList();
        School school = schoolRepository.findById(schoolId).orElse(null);
        return ReceiptView.builder()
                .receiptNumber(txn.getReceiptNumber())
                .schoolName(school != null ? school.getName() : null)
                .razorpayPaymentId(txn.getRazorpayPaymentId()).method(txn.getMethod())
                .amount(txn.getCapturedAmount()).paidAt(txn.getCapturedAt()).lines(lines)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public PaymentView toView(PaymentTransaction t, Long studentId) {
        return PaymentView.builder()
                .id(t.getId()).razorpayPaymentId(t.getRazorpayPaymentId()).razorpayOrderId(t.getRazorpayOrderId())
                .method(t.getMethod()).amount(t.getAmount()).capturedAmount(t.getCapturedAmount())
                .amountRefunded(t.getAmountRefunded()).status(t.getStatus()).gatewayStatus(t.getGatewayStatus())
                .allocated(t.isAllocated()).receiptNumber(t.getReceiptNumber())
                .capturedAt(t.getCapturedAt()).createdAt(t.getCreatedAt())
                .build();
    }

    private List<Long> parseFeeIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        List<Long> ids = new ArrayList<>();
        for (String s : csv.split(",")) if (!s.isBlank()) ids.add(Long.parseLong(s.trim()));
        return ids;
    }

    private BigDecimal net(Fee fee) {
        return fee.getAmount()
                .subtract(fee.getDiscount() != null ? fee.getDiscount() : BigDecimal.ZERO)
                .add(fee.getFine() != null ? fee.getFine() : BigDecimal.ZERO);
    }

    private BigDecimal paidAmount(Long feeId) {
        return feePaymentRepository.findByFeeIdAndDeletedFalse(feeId).stream()
                .map(FeePayment::getAmountPaid).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal balance(Fee fee) {
        return net(fee).subtract(paidAmount(fee.getId())).max(BigDecimal.ZERO);
    }
}
