package com.sms.school.exception;

import com.sms.school.dto.response.ApiResponse;
import com.sms.school.ops.ErrorTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Central place to map every exception into a consistent JSON response.
 * All controllers inherit this handling automatically.
 */
@RestControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ErrorTrackingService errorTracking;

    /** Derive a coarse service label from the request path (…/api/v1/<service>/…). */
    private static String serviceOf(HttpServletRequest req) {
        if (req == null) return "API";
        String p = req.getRequestURI();
        int i = p.indexOf("/api/v1/");
        if (i < 0) return "API";
        String rest = p.substring(i + 8);
        int slash = rest.indexOf('/');
        return (slash > 0 ? rest.substring(0, slash) : rest).toUpperCase();
    }

    // ── Validation errors (e.g. @NotBlank, @Size) ────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            errors.put(field, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Validation failed", errors));
    }

    // ── Entity not found ──────────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── Business rule violations ──────────────────────────────────────
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── Cross-tenant or role-based access denied ──────────────────────
    @ExceptionHandler({UnauthorizedException.class, AccessDeniedException.class})
    public ResponseEntity<ApiResponse<Void>> handleForbidden(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }

    // ── Bad credentials (wrong password) ─────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
    }

    // ── Duplicate / constraint violations ────────────────────────────
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String root = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String lower = root == null ? "" : root.toLowerCase();
        String message;
        if (lower.contains("(email)") || lower.contains("email")) {
            message = "This email is already registered. Please use a different email.";
        } else if (lower.contains("username")) {
            message = "This login ID is already in use.";
        } else if (lower.contains("admission")) {
            message = "This admission number is already in use.";
        } else if (lower.contains("duplicate") || lower.contains("unique")) {
            message = "A record with the same unique value already exists.";
        } else {
            message = "Could not save — a required value is missing or invalid.";
        }
        log.warn("Data integrity violation: {}", root);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message));
    }

    // ── Catch-all ─────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception", ex);
        // Capture to the Operations dashboard. 5xx = ERROR (unexpected system failure).
        errorTracking.record("ERROR", serviceOf(req), "UNHANDLED_EXCEPTION",
                ex.getMessage(), ex, null, null, null, null,
                req != null ? req.getMethod() : null,
                req != null ? req.getRequestURI() : null, 500);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}
