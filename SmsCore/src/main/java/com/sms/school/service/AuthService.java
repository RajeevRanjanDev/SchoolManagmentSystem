package com.sms.school.service;

import com.sms.school.dto.request.LoginRequest;
import com.sms.school.dto.request.RefreshTokenRequest;
import com.sms.school.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(Long userId);

    /** Generate a temporary password for the user with this email/login ID and email it. */
    void forgotPassword(String identifier);
}
