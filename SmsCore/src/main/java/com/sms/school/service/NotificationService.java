package com.sms.school.service;

import com.sms.school.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Notification;
import com.sms.school.entity.NotificationBroadcast;

public interface NotificationService {

    /** Send a notification to a specific user and (optionally) push via FCM */
    void sendNotification(Long schoolId, Long recipientUserId, String title, String body,
                          NotificationType type, Long referenceId);

    /** Broadcast to all users of a school */
    void broadcastToSchool(Long schoolId, String title, String body, NotificationType type);

    /**
     * Broadcast (or schedule) a targeted notification and log it for the "Sent" history.
     * Audience, scope ids, fee-type and scheduledAt all come from the request.
     */
    void broadcast(Long schoolId, com.sms.school.dto.request.BroadcastNotificationRequest request, String sentByName);

    /** Sent-notification history for a school (most recent first). */
    Page<NotificationBroadcast> getSentBroadcasts(Long schoolId, Pageable pageable);

    Page<Notification> getUserNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void registerDevice(Long userId, String fcmToken, String deviceType, String deviceName);
}
