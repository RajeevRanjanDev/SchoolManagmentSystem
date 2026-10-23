package com.sms.school.security;

import com.sms.school.entity.enums.RoleName;
import com.sms.school.exception.UnauthorizedException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter — runs on every request.
 *
 * Responsibilities:
 *  1. Extract and validate Bearer token
 *  2. Load UserPrincipal from DB (ensures user still active/exists)
 *  3. Enforce tenant status: if school is SUSPENDED/TERMINATED,
 *     reject all non-SUPER_ADMIN requests for that tenant
 *  4. Set Spring Security context
 *
 * Tenant status check is done here (filter level) so every endpoint
 * — regardless of controller — is protected without any annotation.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider          jwtTokenProvider;
    private final UserDetailsServiceImpl    userDetailsService;
    private final TenantStatusChecker       tenantStatusChecker;   // NEW — see below

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (userDetails instanceof UserPrincipal principal) {

                // ── Tenant Status Guard ──────────────────────────────────────
                // SUPER_ADMIN always passes through.
                // School users are rejected if their school is SUSPENDED/TERMINATED.
                if (!principal.isSuperAdmin() && principal.getSchoolId() != null) {
                    tenantStatusChecker.assertSchoolActive(principal.getSchoolId());
                }
                // ────────────────────────────────────────────────────────────

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);

                log.debug("Authenticated {} (school={}, type={})",
                        email, principal.getSchoolId(), principal.getUserType());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return (StringUtils.hasText(header) && header.startsWith("Bearer "))
                ? header.substring(7)
                : null;
    }
}
