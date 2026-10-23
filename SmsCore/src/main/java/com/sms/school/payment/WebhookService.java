package com.sms.school.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.school.payment.entity.*;
import com.sms.school.payment.repository.PaymentRepositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Processes Razorpay webhooks. The event is persisted before processing so
 * delivery can repeat safely, and every handler is idempotent. We route by the
 * order id in the (untrusted) payload to find the school, then verify the
 * signature against that school's webhook secret before trusting the event.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final ObjectMapper mapper = new ObjectMapper();
    private final WebhookEventRepo eventRepo;
    private final AttemptRepo attemptRepo;
    private final TransactionRepo txnRepo;
    private final GatewayAccountRepo accountRepo;
    private final RazorpayClient razorpay;
    private final PaymentService paymentService;
    private final com.sms.school.ops.ErrorTrackingService errorTracking;

    /** Returns true if the event was durably accepted (signature valid or recorded for review). */
    @Transactional
    public boolean handle(String rawBody, String signature, String eventIdHeader) {
        // Idempotency on the provider event id.
        if (eventIdHeader != null && eventRepo.findByEventId(eventIdHeader).isPresent()) {
            log.info("Webhook {} already received — skipping", eventIdHeader);
            return true;
        }

        JsonNode root;
        try {
            root = mapper.readTree(rawBody);
        } catch (Exception e) {
            log.warn("Webhook body not JSON: {}", e.getMessage());
            return false;
        }
        String eventType = root.path("event").asText("");
        JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
        JsonNode refundEntity = root.path("payload").path("refund").path("entity");
        String orderId = paymentEntity.path("order_id").asText(
                root.path("payload").path("order").path("entity").path("id").asText(null));

        PaymentAttempt attempt = orderId != null ? attemptRepo.findByRazorpayOrderId(orderId).orElse(null) : null;
        SchoolPaymentGatewayAccount account = attempt != null && attempt.getGatewayAccountId() != null
                ? accountRepo.findById(attempt.getGatewayAccountId()).orElse(null) : null;

        boolean sigValid = account != null && razorpay.verifyWebhookSignature(account, rawBody, signature);

        GatewayWebhookEvent event = eventRepo.save(GatewayWebhookEvent.builder()
                .schoolId(attempt != null ? attempt.getSchoolId() : null)
                .eventId(eventIdHeader).eventType(eventType)
                .signatureValid(sigValid).payload(trim(rawBody))
                .processingStatus(sigValid ? "PENDING" : "IGNORED")
                .receivedAt(LocalDateTime.now())
                .build());

        if (!sigValid) {
            event.setLastError("Signature invalid or school not resolvable");
            eventRepo.save(event);
            return false;   // let Razorpay retry; a genuine event will resolve once the order exists
        }

        try {
            switch (eventType) {
                case "payment.captured", "order.paid" -> {
                    if (attempt != null && !paymentEntity.isMissingNode()) {
                        PaymentTransaction txn = paymentService.recordTransaction(attempt, paymentEntity);
                        paymentService.allocate(txn, attempt);
                    }
                }
                case "payment.failed" -> {
                    // Do not downgrade an already-captured payment.
                    String pid = paymentEntity.path("id").asText(null);
                    if (pid != null) {
                        txnRepo.findByRazorpayPaymentId(pid).ifPresent(t -> {
                            if (!"CAPTURED".equals(t.getStatus())) {
                                t.setStatus("FAILED");
                                t.setGatewayStatus("failed");
                                txnRepo.save(t);
                            }
                        });
                    }
                }
                case "refund.processed", "refund.created" -> {
                    String pid = refundEntity.path("payment_id").asText(null);
                    long refunded = refundEntity.path("amount").asLong(0);
                    if (pid != null) {
                        txnRepo.findByRazorpayPaymentId(pid).ifPresent(t -> {
                            t.setAmountRefunded(java.math.BigDecimal.valueOf(refunded).movePointLeft(2));
                            t.setStatus(refunded >= t.getCapturedAmount().movePointRight(2).longValue()
                                    ? "REFUNDED" : "PARTIALLY_REFUNDED");
                            txnRepo.save(t);
                        });
                    }
                }
                default -> log.info("Unhandled webhook event: {}", eventType);
            }
            event.setProcessingStatus("PROCESSED");
            event.setProcessedAt(LocalDateTime.now());
            eventRepo.save(event);
            return true;
        } catch (Exception ex) {
            log.error("Webhook processing failed for {}: {}", eventType, ex.getMessage());
            event.setProcessingStatus("FAILED");
            event.setLastError(ex.getMessage());
            event.setRetryCount(event.getRetryCount() + 1);
            eventRepo.save(event);
            errorTracking.record("ERROR", "WEBHOOK", "WEBHOOK_PROCESSING_FAILED",
                    "Webhook " + eventType + " failed: " + ex.getMessage(), ex,
                    attempt != null ? attempt.getSchoolId() : null, null,
                    "WEBHOOK_EVENT", event.getId(), null, null, null);
            return false;   // allow retry
        }
    }

    private String trim(String s) {
        return s != null && s.length() > 20000 ? s.substring(0, 20000) : s;
    }
}
