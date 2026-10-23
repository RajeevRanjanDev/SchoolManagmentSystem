package com.sms.school.ops;

import com.sms.school.entity.School;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.ops.dto.OpsDtos.*;
import com.sms.school.ops.entity.SystemErrorLog;
import com.sms.school.payment.repository.PaymentRepositories.TransactionRepo;
import com.sms.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Read/resolve side of the error-tracking system for the Super Admin dashboard. */
@Service
@RequiredArgsConstructor
public class OperationsService {

    private final SystemErrorLogRepository repo;
    private final SchoolRepository schoolRepository;
    private final TransactionRepo txnRepo;

    @Transactional(readOnly = true)
    public OpsSummary summary(int hours) {
        LocalDateTime from = LocalDateTime.now().minusHours(Math.max(1, hours));
        return OpsSummary.builder()
                .systemErrors(repo.countByCreatedAtAfterAndDeletedFalse(from))
                .affectedSchools(repo.countDistinctSchools(from))
                .failedPayments(txnRepo.countByStatusAndCreatedAtAfterAndDeletedFalse("FAILED", from))
                .criticalIncidents(repo.countBySeverityAndCreatedAtAfterAndDeletedFalse("CRITICAL", from))
                .openIncidents(repo.countByStatusAndDeletedFalse("OPEN"))
                .build();
    }

    @Transactional(readOnly = true)
    public Page<ErrorLogView> search(Long schoolId, String service, String severity, String status,
                                     int hours, Pageable pageable) {
        LocalDateTime from = LocalDateTime.now().minusHours(Math.max(1, hours));
        Page<SystemErrorLog> page = repo.search(
                schoolId, blankToNull(service), blankToNull(severity), blankToNull(status), from, pageable);
        Map<Long, String> names = schoolNames(page.getContent());
        return page.map(e -> toView(e, names, false));
    }

    @Transactional(readOnly = true)
    public ErrorLogView detail(Long id) {
        SystemErrorLog e = repo.findById(id).filter(x -> !x.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Error log", id));
        return toView(e, schoolNames(List.of(e)), true);
    }

    @Transactional
    public ErrorLogView resolve(Long id, ResolveRequest req, Long userId) {
        SystemErrorLog e = repo.findById(id).filter(x -> !x.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Error log", id));
        String status = req.getStatus() == null ? "RESOLVED" : req.getStatus().toUpperCase();
        e.setStatus(status);
        e.setResolutionNote(req.getNote());
        e.setOwnerUserId(userId);
        if ("RESOLVED".equals(status)) e.setResolvedAt(LocalDateTime.now());
        return toView(repo.save(e), schoolNames(List.of(e)), false);
    }

    @Transactional(readOnly = true)
    public List<String> services() {
        return repo.distinctServices();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Map<Long, String> schoolNames(List<SystemErrorLog> logs) {
        Set<Long> ids = logs.stream().map(SystemErrorLog::getSchoolId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) return Map.of();
        Map<Long, String> m = new HashMap<>();
        for (School s : schoolRepository.findAllById(ids)) m.put(s.getId(), s.getName());
        return m;
    }

    private ErrorLogView toView(SystemErrorLog e, Map<Long, String> names, boolean withStack) {
        return ErrorLogView.builder()
                .id(e.getId()).schoolId(e.getSchoolId())
                .schoolName(e.getSchoolId() != null ? names.get(e.getSchoolId()) : "Platform")
                .service(e.getService()).severity(e.getSeverity()).errorCode(e.getErrorCode())
                .message(e.getMessage()).requestId(e.getRequestId()).traceId(e.getTraceId()).userId(e.getUserId())
                .httpMethod(e.getHttpMethod()).httpPath(e.getHttpPath()).httpStatus(e.getHttpStatus())
                .referenceType(e.getReferenceType()).referenceId(e.getReferenceId()).environment(e.getEnvironment())
                .occurrenceCount(e.getOccurrenceCount()).status(e.getStatus()).ownerUserId(e.getOwnerUserId())
                .resolutionNote(e.getResolutionNote())
                .createdAt(e.getCreatedAt()).lastSeenAt(e.getLastSeenAt()).resolvedAt(e.getResolvedAt())
                .stackTrace(withStack ? e.getStackTrace() : null)
                .build();
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s; }
}
