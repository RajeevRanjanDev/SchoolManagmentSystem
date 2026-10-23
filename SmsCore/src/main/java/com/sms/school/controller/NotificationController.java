package com.sms.school.controller;

import com.sms.school.dto.request.BroadcastNotificationRequest;
import com.sms.school.dto.request.RegisterDeviceRequest;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.dto.response.BroadcastHistoryResponse;
import com.sms.school.dto.response.NotificationResponse;
import com.sms.school.entity.Notification;
import com.sms.school.entity.NotificationBroadcast;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications, push, and admin broadcasts")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get notifications for the logged-in user")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = TenantContext.getCurrentUserId();
        Page<NotificationResponse> page = notificationService
                .getUserNotifications(userId, pageable)
                .map(this::toNotificationResponse);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    private NotificationResponse toNotificationResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .type(n.getType() != null ? n.getType().name() : null)
                .read(n.isRead())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .attachmentUrl(n.getAttachmentUrl())
                .attachmentName(n.getAttachmentName())
                .build();
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

    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Admin: broadcast a notification to the entire school or a specific audience")
    public ResponseEntity<ApiResponse<Void>> broadcast(
            @Valid @RequestBody BroadcastNotificationRequest request) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        String sentByName = TenantContext.getCurrentUserEmail();
        notificationService.broadcast(schoolId, request, sentByName);
        boolean scheduled = request.getScheduledAt() != null
                && request.getScheduledAt().isAfter(java.time.LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(
                scheduled ? "Notification scheduled" : "Notification sent", null));
    }

    @GetMapping("/sent")
    @PreAuthorize("hasAnyRole('SCHOOL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Admin: history of notifications sent for this school")
    public ResponseEntity<ApiResponse<Page<BroadcastHistoryResponse>>> getSent(
            @PageableDefault(size = 50) Pageable pageable) {
        Long schoolId = TenantContext.getCurrentSchoolId();
        Page<BroadcastHistoryResponse> page = notificationService
                .getSentBroadcasts(schoolId, pageable)
                .map(this::toHistory);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    private BroadcastHistoryResponse toHistory(NotificationBroadcast b) {
        return BroadcastHistoryResponse.builder()
                .id(b.getId())
                .title(b.getTitle())
                .body(b.getBody())
                .type(b.getType() != null ? b.getType().name() : null)
                .audience(b.getAudience())
                .classId(b.getClassId())
                .className(b.getClassName())
                .recipientCount(b.getRecipientCount())
                .sentByName(b.getSentByName())
                .sentAt(b.getCreatedAt())
                .status(b.getStatus())
                .scheduledAt(b.getScheduledAt())
                .build();
    }
}
