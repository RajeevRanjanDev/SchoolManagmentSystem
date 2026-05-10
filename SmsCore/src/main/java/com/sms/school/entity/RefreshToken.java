package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Stores active refresh tokens.
 * When a client exchanges a refresh token for a new access token,
 * the old refresh token is deleted and a new one is issued.
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    public boolean isExpired() {
        return expiryDate.isBefore(Instant.now());
    }
}
