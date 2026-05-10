package com.sms.school.controller;

import com.sms.school.dto.request.RegisterDeviceRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Notification;
import com.sms.school.security.TenantContext;
import com.sms.school.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app and push notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get notifications for the logged-in user")
    public ResponseEntity<ApiResponse<Page<Notification>>> getMyNotifications(
            @PageableDefault(size = 20) Pageable pageable) {

        Long userId = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUserNotifications(userId, pageable)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        Long userId = TenantContext.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUnreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        Long userId = TenantContext.getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }

    @PostMapping("/device")
    @Operation(summary = "Register a device for push notifications")
    public ResponseEntity<ApiResponse<Void>> registerDevice(
            @Valid @RequestBody RegisterDeviceRequest request) {

        Long userId = TenantContext.getCurrentUserId();
        notificationService.registerDevice(userId,
                request.getFcmToken(), request.getDeviceType(), request.getDeviceName());
        return ResponseEntity.ok(ApiResponse.<Void>success(null));
    }
}
