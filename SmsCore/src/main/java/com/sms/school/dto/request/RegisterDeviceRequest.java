package com.sms.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDeviceRequest {

    @NotBlank(message = "FCM token is required")
    private String fcmToken;

    private String deviceType;  // ANDROID, IOS, WEB
    private String deviceName;
}
