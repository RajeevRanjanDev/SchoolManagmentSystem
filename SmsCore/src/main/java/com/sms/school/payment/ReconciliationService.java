package com.sms.school.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.payment.dto.PaymentDtos.*;
import com.sms.school.payment.entity.*;
import com.sms.school.payment.repository.PaymentRepositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

/**
 * Three-way reconciliation: (A) payment ↔ order, (B) captured ↔ fee ledger,
 * (C) settlement ↔ bank credit. Produces exceptions for anything that does not match.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReconciliationService {

    private final AttemptRepo attemptRepo;
    private final TransactionRepo txnRepo;
    private final AllocationRepo allocRepo;
    private final RefundRepo refundRepo;
    private final SettlementRepo settlementRepo;
    private final ReconRunRepo runRepo;
    private final ReconExceptionRepo exceptionRepo;
    private final GatewayAccountRepo accountRepo;
    private final GatewayAccountService gatewayAccounts;
    private final RazorpayClient razorpay;
    private final PaymentService paymentService;
    private final com.sms.school.ops.ErrorTrackingService errorTracking;

    // ── Run ──────────────────────────────────────────────────────────────────

    @Transactional
    public ReconciliationRun run(Long schoolId, LocalDate from, LocalDate to, String source) {
        ReconciliationRun run = runRepo.save(ReconciliationRun.builder()
                .schoolId(schoolId).periodFrom(from).periodTo(to)
                .source(source == null ? "MANUAL" : source).status("RUNNING")
                .startedAt(LocalDateTime.now()).build());
        int checked = 0, repaired = 0, opened = 0;
        try {
            var account = accountRepo.findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(schoolId, "LIVE")
                    .or(() -> accountRepo.findBySchoolIdAndModeAndActiveTrueAndDeletedFalse(schoolId, "TEST"))
                    .orElse(null);

            // A. Recover pending attempts whose capture callback was missed.
            for (PaymentAttempt a : attemptRepo.findByStatusInAndDeletedFalse(List.of("PENDING"))) {
                if (!a.getSchoolId().equals(schoolId) || account == null || a.getRazorpayOrderId() == null) continue;
                checked++;
                try {
                    JsonNode payments = razorpay.fetchOrderPayments(account, a.getRazorpayOrderId());
                    for (JsonNode p : payments.path("items")) {
                        if ("captured".equalsIgnoreCase(p.path("status").asText(""))) {
                            PaymentTransaction t = paymentService.recordTransaction(a, p);
                            paymentService.allocate(t, a);
                            repaired++;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Recon fetch failed for order {}: {}", a.getRazorpayOrderId(), ex.getMessage());
                }
            }

            // B. Captured-but-not-allocated → retry; still unresolved → exception.
            for (PaymentTransaction t : txnRepo.findBySchoolIdAndStatusAndAllocatedFalseAndDeletedFalse(schoolId, "CAPTURED")) {
                checked++;
                attemptRepo.findById(t.getPaymentAttemptId()).ifPresent(a -> paymentService.allocate(t, a));
                PaymentTransaction fresh = txnRepo.findById(t.getId()).orElse(t);
                if (!fresh.isAllocated()) {
                    opened += openException(schoolId, run.getId(), "PAYMENT_NOT_ALLOCATED", "PAYMENT", t.getId(),
                            "Captured payment " + t.getRazorpayPaymentId() + " has no fee allocation.");
                } else {
                    repaired++;
                }
            }

            // Duplicate captured payments for the same order.
            Map<String, List<PaymentTransaction>> byOrder = new HashMap<>();
            for (PaymentTransaction t : txnRepo.findBySchoolIdAndStatusAndDeletedFalse(schoolId, "CAPTURED")) {
                byOrder.computeIfAbsent(t.getRazorpayOrderId(), k -> new ArrayList<>()).add(t);
            }
            for (var e : byOrder.entrySet()) {
                if (e.getValue().size() > 1) {
                    opened += openException(schoolId, run.getId(), "DUPLICATE_PAYMENT", "ORDER", e.getValue().get(0).getId(),
                            "Order " + e.getKey() + " has " + e.getValue().size() + " captured payments — review for refund.");
                }
            }

            // C. Settlement import + match.
            if (account != null && from != null && to != null) {
                importSettlementsInternal(schoolId, account, from, to);
            }
            for (GatewaySettlement s : settlementRepo.findBySchoolIdAndDeletedFalseOrderBySettledOnDesc(schoolId)) {
                if (!s.isBankCreditMatched() && "SETTLED".equals(s.getStatus())
                        && s.getSettledOn() != null && !s.getSettledOn().isBefore(from == null ? LocalDate.MIN : from)) {
                    opened += openException(schoolId, run.getId(), "BANK_CREDIT_NOT_MATCHED", "SETTLEMENT", s.getId(),
                            "Settlement " + s.getRazorpaySettlementId() + " (net ₹" + s.getNetAmount() + ") not yet matched to a bank credit.");
                }
            }

            run.setPaymentsChecked(checked);
            run.setAllocationsRepaired(repaired);
            run.setExceptionsOpened(opened);
            run.setStatus("COMPLETED");
        } catch (Exception ex) {
            run.setStatus("FAILED");
            log.error("Reconciliation run failed: {}", ex.getMessage());
        }
        run.setFinishedAt(LocalDateTime.now());
        return runRepo.save(run);
    }

    /** Open an exception unless an identical open one already exists. Returns 1 if opened. */
    private int openException(Long schoolId, Long runId, String type, String refType, Long refId, String desc) {
        if (exceptionRepo.existsByExceptionTypeAndReferenceIdAndStatusAndDeletedFalse(type, refId, "OPEN")) return 0;
        exceptionRepo.save(ReconciliationException.builder()
                .schoolId(schoolId).reconciliationRunId(runId).exceptionType(type)
                .referenceType(refType).referenceId(refId).description(desc).status("OPEN")
                .build());
        // Surface money-critical exceptions on the Operations dashboard too.
        if ("PAYMENT_NOT_ALLOCATED".equals(type) || "DUPLICATE_PAYMENT".equals(type)) {
            errorTracking.record("CRITICAL", "RECONCILIATION", type, desc, null,
                    schoolId, null, refType, refId, null, null, null);
        }
        return 1;
    }

    // ── Settlement import ────────────────────────────────────────────────────

    @Transactional
    public int importSettlements(Long schoolId, LocalDate from, LocalDate to) {
        var account = gatewayAccounts.resolveActive(schoolId);
        return importSettlementsInternal(schoolId, account, from, to);
    }

    private int importSettlementsInternal(Long schoolId, SchoolPaymentGatewayAccount account, LocalDate from, LocalDate to) {
        long fromEpoch = from.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
        long toEpoch = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toEpochSecond();
        int count = 0;
        try {
            JsonNode res = razorpay.listSettlements(account, fromEpoch, toEpoch);
            for (JsonNode s : res.path("items")) {
                String id = s.path("id").asText(null);
                if (id == null) continue;
                GatewaySettlement gs = settlementRepo.findBySchoolIdAndRazorpaySettlementId(schoolId, id)
                        .orElseGet(() -> GatewaySettlement.builder().schoolId(schoolId).razorpaySettlementId(id).build());
                gs.setUtr(s.path("utr").asText(gs.getUtr()));
                gs.setGrossAmount(paise(s.path("amount").asLong(0)));
                gs.setFees(paise(s.path("fees").asLong(0)));
                gs.setTax(paise(s.path("tax").asLong(0)));
                gs.setNetAmount(paise(s.path("amount").asLong(0) - s.path("fees").asLong(0) - s.path("tax").asLong(0)));
                long created = s.path("created_at").asLong(0);
                if (created > 0) gs.setSettledOn(Instant.ofEpochSecond(created).atZone(ZoneOffset.UTC).toLocalDate());
                gs.setStatus("processed".equalsIgnoreCase(s.path("status").asText("")) ? "SETTLED" : "EXPECTED");
                settlementRepo.save(gs);
                count++;
            }
        } catch (Exception ex) {
            log.warn("Settlement import failed: {}", ex.getMessage());
            throw new BusinessException("Could not import settlements: " + ex.getMessage());
        }
        return count;
    }

    // ── Bank statement import ────────────────────────────────────────────────

    /** Match bank credits (CSV: columns containing a date, an amount, and a reference/UTR) to settlements. */
    @Transactional
    public Map<String, Object> importBankStatement(Long schoolId, MultipartFile file) {
        int matched = 0, unmatched = 0;
        List<GatewaySettlement> settlements = settlementRepo.findBySchoolIdAndDeletedFalseOrderBySettledOnDesc(schoolId);
        try (var reader = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
            String line; boolean header = true;
            while ((line = reader.readLine()) != null) {
                if (header) { header = false; continue; }   // skip header row
                if (line.isBlank()) continue;
                String[] cols = line.split(",");
                String ref = String.join(" ", cols).toLowerCase();
                BigDecimal amount = firstAmount(cols);
                LocalDate date = firstDate(cols);
                GatewaySettlement m = settlements.stream()
                        .filter(s -> !s.isBankCreditMatched())
                        .filter(s -> (s.getUtr() != null && ref.contains(s.getUtr().toLowerCase()))
                                || (amount != null && s.getNetAmount() != null
                                    && s.getNetAmount().subtract(amount).abs().compareTo(new BigDecimal("1.00")) <= 0))
                        .findFirst().orElse(null);
                if (m != null) {
                    m.setBankCreditMatched(true);
                    m.setBankCreditAmount(amount);
                    m.setBankCreditDate(date);
                    settlementRepo.save(m);
                    matched++;
                } else {
                    unmatched++;
                }
            }
        } catch (Exception e) {
            throw new BusinessException("Could not read the bank statement file.");
        }
        return Map.of("matched", matched, "unmatched", unmatched);
    }

    // ── Exceptions ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ExceptionView> listExceptions(Long schoolId, String status) {
        var list = (status == null || status.isBlank())
                ? exceptionRepo.findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(schoolId)
                : exceptionRepo.findBySchoolIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(schoolId, status.toUpperCase());
        return list.stream().map(this::toExcView).toList();
    }

    @Transactional
    public ExceptionView resolveException(Long schoolId, Long id, ResolveExceptionRequest req, Long userId) {
        ReconciliationException e = exceptionRepo.findById(id)
                .filter(x -> x.getSchoolId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Exception", id));
        String status = req.getStatus() == null ? "RESOLVED" : req.getStatus().toUpperCase();
        e.setStatus(status);
        e.setResolutionNote(req.getNote());
        e.setResolvedByUserId(userId);
        e.setResolvedAt(LocalDateTime.now());
        return toExcView(exceptionRepo.save(e));
    }

    // ── Refunds ──────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> refund(Long schoolId, Long txnId, BigDecimal amount, String reason, Long userId) {
        PaymentTransaction t = txnRepo.findById(txnId)
                .filter(x -> x.getSchoolId().equals(schoolId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", txnId));
        if (!"CAPTURED".equals(t.getStatus()) && !"PARTIALLY_REFUNDED".equals(t.getStatus())) {
            throw new BusinessException("Only a captured payment can be refunded.");
        }
        var account = gatewayAccounts.resolveActive(schoolId);
        long paise = amount != null && amount.signum() > 0 ? amount.movePointRight(2).longValueExact() : 0;

        PaymentRefund refund = refundRepo.save(PaymentRefund.builder()
                .schoolId(schoolId).paymentTransactionId(txnId)
                .amount(amount != null ? amount : t.getCapturedAmount())
                .reason(reason).status("PROCESSING").requestedByUserId(userId).build());

        JsonNode r = razorpay.createRefund(account, t.getRazorpayPaymentId(), paise, reason);
        refund.setRazorpayRefundId(r.path("id").asText(null));
        String st = r.path("status").asText("processed");
        refund.setStatus("processed".equalsIgnoreCase(st) ? "PROCESSED" : "PROCESSING");
        if ("PROCESSED".equals(refund.getStatus())) refund.setCompletedAt(LocalDateTime.now());
        refundRepo.save(refund);

        // Record on the transaction (webhook refund.processed will confirm).
        BigDecimal already = t.getAmountRefunded() == null ? BigDecimal.ZERO : t.getAmountRefunded();
        t.setAmountRefunded(already.add(refund.getAmount()));
        t.setStatus(t.getAmountRefunded().compareTo(t.getCapturedAmount()) >= 0 ? "REFUNDED" : "PARTIALLY_REFUNDED");
        txnRepo.save(t);
        return Map.of("refundId", refund.getRazorpayRefundId() == null ? "" : refund.getRazorpayRefundId(),
                "status", refund.getStatus());
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReconSummary summary(Long schoolId) {
        BigDecimal captured = BigDecimal.ZERO, allocated = BigDecimal.ZERO;
        long unmatched = 0;
        for (PaymentTransaction t : txnRepo.findBySchoolIdAndStatusAndDeletedFalse(schoolId, "CAPTURED")) {
            captured = captured.add(nz(t.getCapturedAmount()));
            if (t.isAllocated()) {
                allocated = allocated.add(allocRepo.findByPaymentTransactionId(t.getId()).stream()
                        .map(PaymentAllocation::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            } else {
                unmatched++;
            }
        }
        BigDecimal expectedNet = settlementRepo.findBySchoolIdAndDeletedFalseOrderBySettledOnDesc(schoolId).stream()
                .map(s -> nz(s.getNetAmount())).reduce(BigDecimal.ZERO, BigDecimal::add);
        long settlementExc = settlementRepo.findBySchoolIdAndDeletedFalseOrderBySettledOnDesc(schoolId).stream()
                .filter(s -> !s.isBankCreditMatched()).count();
        return ReconSummary.builder()
                .capturedTotal(captured).allocatedTotal(allocated).expectedSettlement(expectedNet)
                .unmatchedPayments(unmatched).settlementExceptions(settlementExc)
                .openExceptions(exceptionRepo.countBySchoolIdAndStatusAndDeletedFalse(schoolId, "OPEN"))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<PaymentView> listPayments(Long schoolId, Pageable pageable) {
        return txnRepo.findBySchoolIdAndDeletedFalseOrderByCreatedAtDesc(schoolId, pageable)
                .map(t -> paymentService.toView(t, t.getStudentId()));
    }

    @Transactional(readOnly = true)
    public List<ReconciliationRun> listRuns(Long schoolId) {
        return runRepo.findBySchoolIdAndDeletedFalseOrderByStartedAtDesc(schoolId);
    }

    // ── Scheduled ────────────────────────────────────────────────────────────

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void nightlyReconciliation() {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(7);
        for (SchoolPaymentGatewayAccount acc : accountRepo.findAll()) {
            if (acc.isDeleted() || !acc.isActive()) continue;
            try {
                run(acc.getSchool().getId(), from, to, "SCHEDULED");
            } catch (Exception ex) {
                log.warn("Nightly reconciliation failed for school {}: {}", acc.getSchool().getId(), ex.getMessage());
            }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ExceptionView toExcView(ReconciliationException e) {
        return ExceptionView.builder()
                .id(e.getId()).exceptionType(e.getExceptionType()).referenceType(e.getReferenceType())
                .referenceId(e.getReferenceId()).description(e.getDescription()).status(e.getStatus())
                .resolutionNote(e.getResolutionNote()).createdAt(e.getCreatedAt())
                .build();
    }

    private static BigDecimal paise(long p) { return BigDecimal.valueOf(p).movePointLeft(2); }
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    private static BigDecimal firstAmount(String[] cols) {
        for (String c : cols) {
            String s = c.replaceAll("[^0-9.\\-]", "");
            if (!s.isBlank() && s.matches("-?\\d+(\\.\\d+)?")) {
                try { BigDecimal b = new BigDecimal(s); if (b.signum() > 0) return b; } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private static LocalDate firstDate(String[] cols) {
        for (String c : cols) {
            String s = c.trim();
            for (String fmt : new String[]{"yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy"}) {
                try { return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern(fmt)); }
                catch (Exception ignored) {}
            }
        }
        return null;
    }
}
