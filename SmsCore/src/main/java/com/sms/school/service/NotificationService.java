package com.sms.school.service;

import com.sms.school.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.sms.school.dto.response.ApiResponse;
import com.sms.school.entity.Notification;

public interface NotificationService {

    /** Send a notification to a specific user and (optionally) push via FCM */
    void sendNotification(Long schoolId, Long recipientUserId, String title, String body,
                          NotificationType type, Long referenceId);

    /** Broadcast to all users of a school */
    void broadcastToSchool(Long schoolId, String title, String body, NotificationType type);

    Page<Notification> getUserNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void registerDevice(Long userId, String fcmToken, String deviceType, String deviceName);
}
