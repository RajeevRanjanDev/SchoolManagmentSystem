package com.sms.school.ops;

import com.sms.school.ops.entity.SystemErrorLog;
import com.sms.school.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;

/**
 * Captures failures into {@code system_error_logs} for the Super Admin Operations
 * dashboard. Records in its own transaction so a failing/rolling-back caller still
 * leaves a trace, and never throws out of the capture itself.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ErrorTrackingService {

    private final SystemErrorLogRepository repo;

    @Value("${spring.profiles.active:default}")
    private String environment;

    /** Full capture. All context args are optional; MDC/TenantContext fill the gaps. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String severity, String service, String errorCode, String message, Throwable ex,
                       Long schoolId, Long userId, String refType, Long refId,
                       String httpMethod, String httpPath, Integer httpStatus) {
        try {
            Long sId = schoolId != null ? schoolId : safe(TenantContext::getCurrentSchoolId);
            Long uId = userId != null ? userId : safe(TenantContext::getCurrentUserId);
            String requestId = MDC.get("requestId");
            String traceId = MDC.get("traceId");
            String stack = ex != null ? stackToString(ex) : null;
            String msg = trim(message != null ? message : (ex != null ? ex.getMessage() : "Unknown error"), 2000);
            String fp = fingerprint(service, errorCode, msg);

            // Group repeats of the same failure within the last hour.
            var existing = repo.findFirstByFingerprintAndStatusNotAndCreatedAtAfterOrderByCreatedAtDesc(
                    fp, "RESOLVED", LocalDateTime.now().minusHours(1)).orElse(null);
            if (existing != null) {
                existing.setOccurrenceCount(existing.getOccurrenceCount() + 1);
                existing.setLastSeenAt(LocalDateTime.now());
                if (stack != null && existing.getStackTrace() == null) existing.setStackTrace(trim(stack, 12000));
                repo.save(existing);
                return;
            }

            repo.save(SystemErrorLog.builder()
                    .schoolId(sId).service(service == null ? "API" : service)
                    .severity(severity == null ? "ERROR" : severity)
                    .errorCode(errorCode).message(msg).stackTrace(trim(stack, 12000))
                    .requestId(requestId).traceId(traceId).userId(uId)
                    .httpMethod(httpMethod).httpPath(httpPath).httpStatus(httpStatus)
                    .referenceType(refType).referenceId(refId).environment(environment)
                    .fingerprint(fp).occurrenceCount(1).lastSeenAt(LocalDateTime.now())
                    .status("OPEN")
                    .build());
        } catch (Exception self) {
            // Error tracking must never break the app.
            log.warn("Could not persist system error log: {}", self.getMessage());
        }
    }

    /** Convenience for business-state failures raised inside a service. */
    public void record(String severity, String service, String errorCode, String message, Throwable ex,
                       String refType, Long refId) {
        record(severity, service, errorCode, message, ex, null, null, refType, refId, null, null, null);
    }

    public void record(String severity, String service, String errorCode, String message, Throwable ex) {
        record(severity, service, errorCode, message, ex, null, null, null, null, null, null, null);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private interface Supplier { Long get(); }
    private Long safe(Supplier s) { try { return s.get(); } catch (Exception e) { return null; } }

    private static String fingerprint(String service, String code, String msg) {
        String firstLine = msg == null ? "" : msg.split("\\R", 2)[0];
        if (firstLine.length() > 160) firstLine = firstLine.substring(0, 160);
        return (service + "|" + code + "|" + Integer.toHexString(firstLine.hashCode()));
    }

    private static String stackToString(Throwable ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    private static String trim(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }
}
