package com.sms.school.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Request/response DTOs for the payment + reconciliation APIs. */
public final class PaymentDtos {
    private PaymentDtos() {}

    @Data
    public static class CreateOrderRequest {
        private List<Long> feeIds;
    }

    @Data @Builder
    public static class CreateOrderResponse {
        private Long paymentAttemptId;
        private String razorpayOrderId;
        private long amount;          // paise
        private BigDecimal amountRupees;
        private String currency;
        private String razorpayKeyId;
        private String schoolName;
        private String studentName;
        private String prefillEmail;
        private String prefillContact;
    }

    @Data
    public static class VerifyPaymentRequest {
        private Long paymentAttemptId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data @Builder
    public static class PaymentView {
        private Long id;
        private String razorpayPaymentId;
        private String razorpayOrderId;
        private String method;
        private BigDecimal amount;
        private BigDecimal capturedAmount;
        private BigDecimal amountRefunded;
        private String status;
        private String gatewayStatus;
        private boolean allocated;
        private String receiptNumber;
        private LocalDateTime capturedAt;
        private LocalDateTime createdAt;
        private String studentName;
    }

    @Data @Builder
    public static class ReceiptView {
        private String receiptNumber;
        private String schoolName;
        private String studentName;
        private String admissionNumber;
        private String razorpayPaymentId;
        private String method;
        private BigDecimal amount;
        private LocalDateTime paidAt;
        private List<Line> lines;

        @Data @Builder
        public static class Line {
            private String feeCategory;
            private String feePeriod;
            private BigDecimal amount;
        }
    }

    @Data
    public static class GatewayAccountRequest {
        private String mode;          // TEST | LIVE
        private String keyId;
        private String keySecret;     // plaintext in; stored encrypted
        private String webhookSecret; // plaintext in; stored encrypted
        private Boolean active;
    }

    @Data @Builder
    public static class GatewayAccountView {
        private Long id;
        private String mode;
        private String keyId;
        private boolean hasSecret;
        private boolean hasWebhookSecret;
        private boolean active;
    }

    @Data @Builder
    public static class ReconSummary {
        private BigDecimal capturedTotal;
        private BigDecimal allocatedTotal;
        private BigDecimal expectedSettlement;
        private long unmatchedPayments;
        private long settlementExceptions;
        private long openExceptions;
    }

    @Data @Builder
    public static class ExceptionView {
        private Long id;
        private String exceptionType;
        private String referenceType;
        private Long referenceId;
        private String description;
        private String status;
        private String resolutionNote;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ResolveExceptionRequest {
        private String status;        // RESOLVED | WAIVED_WITH_APPROVAL | INVESTIGATING
        private String note;
    }

    @Data
    public static class RefundRequest {
        private BigDecimal amount;    // null/0 = full
        private String reason;
    }
}
