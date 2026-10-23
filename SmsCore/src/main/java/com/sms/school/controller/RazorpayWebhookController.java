package com.sms.school.controller;

import com.sms.school.payment.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Razorpay calls this directly (not a parent/student API). We verify the raw
 * body against the configured webhook secret; a parent login token is NOT used.
 */
@RestController
@RequestMapping("/api/v1/webhooks/razorpay")
@RequiredArgsConstructor
@Tag(name = "Razorpay Webhook", description = "Gateway → backend event delivery")
public class RazorpayWebhookController {

    private final WebhookService webhookService;

    @PostMapping
    @Operation(summary = "Receive a Razorpay webhook event")
    public ResponseEntity<String> receive(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {

        boolean accepted = webhookService.handle(rawBody, signature, eventId);
        // 200 once durably accepted; otherwise 4xx/5xx so Razorpay retries.
        return accepted
                ? ResponseEntity.ok("ok")
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body("rejected");
    }
}
