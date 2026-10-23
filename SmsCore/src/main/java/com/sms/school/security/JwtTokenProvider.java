package com.sms.school.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * Utility for creating, parsing, and validating JWTs.
 *
 * JWT Payload Design:
 *
 *  SUPER_ADMIN token:
 *    { sub, userId, userType:"SUPER_ADMIN", roles:"SUPER_ADMIN" }
 *    — NO schoolId / schoolCode / schoolName
 *
 *  SCHOOL_USER token (SCHOOL_ADMIN / TEACHER / PARENT / etc.):
 *    { sub, userId, userType:"SCHOOL_USER",
 *      schoolId, schoolCode, schoolName, roles:"SCHOOL_ADMIN,..." }
 *
 *  Front-end reads schoolName/schoolCode from the decoded token to
 *  display branding immediately on dashboard, before any API call.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long accessTokenExpiryMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry-ms}") long accessTokenExpiryMs) {

        byte[] keyBytes = Decoders.BASE64.decode(
                java.util.Base64.getEncoder().encodeToString(secret.getBytes()));
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiryMs = accessTokenExpiryMs;
    }

    // ── Token generation ───────────────────────────────────────────────────────

    public String generateToken(Authentication authentication) {
        return buildToken((UserPrincipal) authentication.getPrincipal());
    }

    public String generateTokenFromPrincipal(UserPrincipal principal) {
        return buildToken(principal);
    }

    private String buildToken(UserPrincipal principal) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiryMs);

        String roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(Collectors.joining(","));

        JwtBuilder builder = Jwts.builder()
                .subject(principal.getUsername())
                .claim("userId",   principal.getUserId())
                .claim("userType", principal.getUserType())
                .claim("roles",    roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey);

        // School-scoped users embed tenant identity in the token.
        // This allows the front-end to show school branding without an extra API call.
        if (!principal.isSuperAdmin() && principal.getSchoolId() != null) {
            builder
                .claim("schoolId",   principal.getSchoolId())
                .claim("schoolCode", principal.getSchoolCode())
                .claim("schoolName", principal.getSchoolName());
        }

        return builder.compact();
    }

    // ── Token parsing ──────────────────────────────────────────────────────────

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    /** Returns null for SUPER_ADMIN (no schoolId in token). */
    public Long getSchoolIdFromToken(String token) {
        return parseClaims(token).get("schoolId", Long.class);
    }

    public String getSchoolCodeFromToken(String token) {
        return parseClaims(token).get("schoolCode", String.class);
    }

    public String getSchoolNameFromToken(String token) {
        return parseClaims(token).get("schoolName", String.class);
    }

    public String getUserTypeFromToken(String token) {
        return parseClaims(token).get("userType", String.class);
    }

    // ── Token validation ───────────────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT expired: {}", ex.getMessage());
        } catch (JwtException ex) {
            log.warn("Invalid JWT: {}", ex.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
