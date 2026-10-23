package com.sms.school.ops;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Attaches a request id to the MDC for every request so log lines (and captured
 * failures) can be correlated. Runs first and clears the MDC afterwards to avoid
 * leaking context between reused threads. Tenant/user are added to captures at
 * record time from TenantContext (populated after JWT auth).
 */
@Component("opsRequestIdFilter")   // unique name — avoids clashing with Spring's built-in requestContextFilter
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader("X-Request-Id");
        String requestId = (incoming != null && !incoming.isBlank())
                ? incoming : UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        // Reuse requestId as trace id unless a tracer provides one.
        MDC.put("traceId", requestId);
        response.setHeader("X-Request-Id", requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("requestId");
            MDC.remove("traceId");
        }
    }
}
