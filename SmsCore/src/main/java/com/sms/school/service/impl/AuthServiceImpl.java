package com.sms.school.service.impl;

import com.sms.school.dto.request.LoginRequest;
import com.sms.school.dto.request.RefreshTokenRequest;
import com.sms.school.dto.response.AuthResponse;
import com.sms.school.entity.RefreshToken;
import com.sms.school.entity.User;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.RefreshTokenRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.security.JwtTokenProvider;
import com.sms.school.security.UserPrincipal;
import com.sms.school.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.sms.school.service.EmailService emailService;
    private final com.sms.school.repository.SchoolRepository schoolRepository;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate credentials (throws BadCredentialsException on failure)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        // 1b. Gate on the school's subscription — logins only work while active.
        //     SUPER_ADMIN (no school) is exempt.
        if (principal.getSchoolId() != null) {
            schoolRepository.findById(principal.getSchoolId()).ifPresent(school -> {
                String st = school.getStatus();
                if ("SUSPENDED".equals(st) || "TERMINATED".equals(st)) {
                    throw new BusinessException("This school's account is " + st.toLowerCase()
                            + ". Please contact the administrator.");
                }
                if (school.getSubscriptionExpiry() != null
                        && school.getSubscriptionExpiry().isBefore(java.time.LocalDate.now())) {
                    throw new BusinessException(
                            "Your school's subscription has expired. Logins are disabled until it is renewed.");
                }
            });
        }

        // 2. Generate access token
        String accessToken = jwtTokenProvider.generateToken(authentication);

        // 3. Create/replace refresh token
        String refreshTokenValue = createRefreshToken(principal.getUserId());

        // 4. Build roles set for response
        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // 5. Load full name
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getUserId()));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .userId(principal.getUserId())
                .schoolId(principal.getSchoolId())
                .email(principal.getUsername())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));

        if (storedToken.isExpired()) {
            refreshTokenRepository.delete(storedToken);
            throw new BusinessException("Refresh token expired. Please log in again.");
        }

        User user = storedToken.getUser();
        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtTokenProvider.generateTokenFromPrincipal(principal);

        // Rotate refresh token on every use (prevents token theft)
        refreshTokenRepository.delete(storedToken);
        String newRefreshToken = createRefreshToken(user.getId());

        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .schoolId(principal.getSchoolId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        refreshTokenRepository.deleteByUser(user);
    }

    @Override
    @Transactional
    public void forgotPassword(String identifier) {
        if (identifier == null || identifier.isBlank()) return;
        String id = identifier.trim();
        // Admins log in with email; students/teachers with a generated username.
        User user = userRepository.findByEmail(id)
                .or(() -> userRepository.findByUsername(id))
                .orElse(null);
        // Silently no-op if there's no account or no email on file (avoids leaking
        // which identifiers exist). The UI always shows the same message.
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return;

        String temp = com.sms.school.util.PasswordUtils.generateTempPassword();
        user.setPassword(passwordEncoder.encode(temp));
        userRepository.save(user);

        String loginId = user.getUsername() != null ? user.getUsername() : user.getEmail();
        emailService.sendTempPassword(user.getEmail(),
                (user.getFirstName() + " " + user.getLastName()).trim(), loginId, temp);
    }

    // ── Private helper ────────────────────────────────────────────────

    private String createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String newTokenValue = UUID.randomUUID().toString();
        Instant newExpiry = Instant.now().plusMillis(refreshTokenExpiryMs);

        // Upsert: update existing token in-place to avoid unique constraint on user_id
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .map(existing -> {
                    existing.setToken(newTokenValue);
                    existing.setExpiryDate(newExpiry);
                    return existing;
                })
                .orElseGet(() -> RefreshToken.builder()
                        .user(user)
                        .token(newTokenValue)
                        .expiryDate(newExpiry)
                        .build());

        return refreshTokenRepository.save(refreshToken).getToken();
    }
}
