package com.sms.school.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores FCM device tokens for push notification delivery.
 * A user may have multiple devices (phone + tablet).
 */
@Entity
@Table(name = "devices",
        indexes = @Index(name = "idx_device_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "fcm_token", nullable = false)
    private String fcmToken;

    @Column(name = "device_type")
    private String deviceType;  // ANDROID, IOS, WEB

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
