package com.sms.school.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.school.exception.BusinessException;
import com.sms.school.payment.entity.SchoolPaymentGatewayAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

/**
 * Thin Razorpay REST client using HTTP Basic auth (keyId:keySecret) and HMAC-SHA256
 * signature verification — no SDK dependency. Each call takes the school's own
 * decrypted gateway account so every request is bound to the correct merchant.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RazorpayClient {

    private static final String BASE = "https://api.razorpay.com/v1";
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();
    private final CryptoService crypto;

    private HttpHeaders auth(SchoolPaymentGatewayAccount acc) {
        HttpHeaders h = new HttpHeaders();
        h.setBasicAuth(acc.getKeyId(), crypto.decrypt(acc.getKeySecret()));
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    /** Create an order; returns the parsed JSON (id, amount, currency, status). */
    public JsonNode createOrder(SchoolPaymentGatewayAccount acc, long amountPaise, String currency,
                                String receipt, Map<String, Object> notes) {
        Map<String, Object> body = Map.of(
                "amount", amountPaise,
                "currency", currency,
                "receipt", receipt,
                "payment_capture", 1,
                "notes", notes == null ? Map.of() : notes);
        return post(acc, "/orders", body);
    }

    public JsonNode fetchPayment(SchoolPaymentGatewayAccount acc, String paymentId) {
        return get(acc, "/payments/" + paymentId);
    }

    public JsonNode fetchOrderPayments(SchoolPaymentGatewayAccount acc, String orderId) {
        return get(acc, "/orders/" + orderId + "/payments");
    }

    public JsonNode createRefund(SchoolPaymentGatewayAccount acc, String paymentId, long amountPaise, String reason) {
        Map<String, Object> body = amountPaise > 0
                ? Map.of("amount", amountPaise, "notes", Map.of("reason", reason == null ? "" : reason))
                : Map.of("notes", Map.of("reason", reason == null ? "" : reason));
        return post(acc, "/payments/" + paymentId + "/refund", body);
    }

    /** List settlements between two epoch-second timestamps. */
    public JsonNode listSettlements(SchoolPaymentGatewayAccount acc, long fromEpoch, long toEpoch) {
        return get(acc, "/settlements?from=" + fromEpoch + "&to=" + toEpoch + "&count=100");
    }

    // ── Signature verification ───────────────────────────────────────────────

    /** Standard Checkout: HMAC_SHA256(order_id + "|" + payment_id, keySecret). */
    public boolean verifyPaymentSignature(SchoolPaymentGatewayAccount acc, String orderId,
                                          String paymentId, String signature) {
        String expected = hmacSha256(orderId + "|" + paymentId, crypto.decrypt(acc.getKeySecret()));
        return constantTimeEquals(expected, signature);
    }

    /** Webhook: HMAC_SHA256(rawBody, webhookSecret). */
    public boolean verifyWebhookSignature(SchoolPaymentGatewayAccount acc, String rawBody, String signature) {
        if (acc.getWebhookSecret() == null) return false;
        String expected = hmacSha256(rawBody, crypto.decrypt(acc.getWebhookSecret()));
        return constantTimeEquals(expected, signature);
    }

    public static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failed", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }

    // ── HTTP helpers ─────────────────────────────────────────────────────────

    private JsonNode post(SchoolPaymentGatewayAccount acc, String path, Object body) {
        try {
            ResponseEntity<String> res = rest.exchange(BASE + path, HttpMethod.POST,
                    new HttpEntity<>(body, auth(acc)), String.class);
            return mapper.readTree(res.getBody());
        } catch (Exception e) {
            log.error("Razorpay POST {} failed: {}", path, e.getMessage());
            throw new BusinessException("Payment gateway error: " + rootMessage(e));
        }
    }

    private JsonNode get(SchoolPaymentGatewayAccount acc, String path) {
        try {
            ResponseEntity<String> res = rest.exchange(BASE + path, HttpMethod.GET,
                    new HttpEntity<>(auth(acc)), String.class);
            return mapper.readTree(res.getBody());
        } catch (Exception e) {
            log.error("Razorpay GET {} failed: {}", path, e.getMessage());
            throw new BusinessException("Payment gateway error: " + rootMessage(e));
        }
    }

    private String rootMessage(Exception e) {
        String m = e.getMessage();
        return m == null ? "unknown" : (m.length() > 180 ? m.substring(0, 180) : m);
    }
}
